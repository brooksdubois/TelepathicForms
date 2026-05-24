import {
  Canvas,
  Circle,
  FabricText,
  Group,
  Rect,
  Textbox,
} from "fabric";
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";
import {
  FormRenderer,
  buildGraphFromFormSpec,
  type FormSpec,
} from "../engine/generators";
import { TriggerOperators, type FieldSpec } from "../engine/types";

type FormPreviewProps = {
  formSpec: FormSpec;
  showTriggers: boolean;
  onShowTriggersChange: (next: boolean) => void;
};

type PreviewRuntime = {
  formSpec: FormSpec;
  handlesById: ReturnType<typeof buildGraphFromFormSpec>["handlesById"];
};

type TriggerBadgeKind =
  | TriggerOperators.setHidden
  | TriggerOperators.setDisabled
  | TriggerOperators.setValue;

type TriggerBadgeStyle = {
  label: string;
  fill: string;
  stroke: string;
  operationLabel: string;
};

type TriggerBadgeMeta = {
  fieldId: string;
  style: TriggerBadgeStyle;
  affectedFieldIds: string[];
};

type TriggerBadgeData = {
  kind: TriggerBadgeKind;
  affectedFieldIds: string[];
};

type TriggerBadgeEntry = {
  centerX: number;
  centerY: number;
  radius: number;
  metadata: TriggerBadgeMeta;
};

const TRIGGER_BADGE_ORDER: TriggerBadgeKind[] = [
  TriggerOperators.setHidden,
  TriggerOperators.setDisabled,
  TriggerOperators.setValue,
];

const TRIGGER_BADGE_STYLE_BY_KIND: Record<TriggerBadgeKind, TriggerBadgeStyle> = {
  [TriggerOperators.setHidden]: {
    label: "H",
    fill: "#2563eb",
    stroke: "#1d4ed8",
    operationLabel: "setHidden",
  },
  [TriggerOperators.setDisabled]: {
    label: "D",
    fill: "#ea580c",
    stroke: "#c2410c",
    operationLabel: "setDisabled",
  },
  [TriggerOperators.setValue]: {
    label: "V",
    fill: "#059669",
    stroke: "#047857",
    operationLabel: "setValue",
  },
};

const collectTriggerBadges = (field: FieldSpec): TriggerBadgeData[] => {
  const triggers = field.triggers ?? [];
  if (triggers.length === 0) return [];

  const affectedByKind = new Map<TriggerBadgeKind, Set<string>>();

  for (const trigger of triggers) {
    const operations = "operations" in trigger ? trigger.operations : [trigger.operation];
    for (const operation of operations) {
      if (
        operation.operator === TriggerOperators.setHidden ||
        operation.operator === TriggerOperators.setDisabled ||
        operation.operator === TriggerOperators.setValue
      ) {
        const existing = affectedByKind.get(operation.operator) ?? new Set<string>();
        operation.fieldIds.forEach((fieldId) => existing.add(fieldId));
        affectedByKind.set(operation.operator, existing);
      }
    }
  }

  return TRIGGER_BADGE_ORDER
    .filter((kind) => affectedByKind.has(kind))
    .map((kind) => ({
      kind,
      affectedFieldIds: Array.from(affectedByKind.get(kind) ?? []),
    }));
};

const FormPreview: Component<FormPreviewProps> = (props) => {
  const [runtime, setRuntime] = createSignal<PreviewRuntime | null>(null);
  const [viewportElement, setViewportElement] = createSignal<HTMLDivElement>();
  const [overlayCanvasElement, setOverlayCanvasElement] = createSignal<HTMLCanvasElement>();
  const [formContentElement, setFormContentElement] = createSignal<HTMLDivElement>();
  const triggerBadgesByFieldId = createMemo(() => {
    const map = new Map<string, TriggerBadgeData[]>();

    for (const field of props.formSpec.fields) {
      const badges = collectTriggerBadges(field);
      if (badges.length > 0) {
        map.set(field.id, badges);
      }
    }

    return map;
  });

  let triggerOverlayCanvas: Canvas | null = null;
  let triggerOverlayHost: HTMLCanvasElement | null = null;
  let triggerBadgeEntries: TriggerBadgeEntry[] = [];
  let hoverTooltipRect: Rect | null = null;
  let hoverTooltipText: FabricText | Textbox | null = null;
  let activeTooltipSignature: string | null = null;

  const hideTriggerTooltip = () => {
    if (!triggerOverlayCanvas) return;

    if (hoverTooltipRect) {
      triggerOverlayCanvas.remove(hoverTooltipRect);
      hoverTooltipRect = null;
    }

    if (hoverTooltipText) {
      triggerOverlayCanvas.remove(hoverTooltipText);
      hoverTooltipText = null;
    }

    activeTooltipSignature = null;
  };

  const resolveHoveredBadgeEntry = (x: number, y: number): TriggerBadgeEntry | null => {
    for (let index = triggerBadgeEntries.length - 1; index >= 0; index -= 1) {
      const entry = triggerBadgeEntries[index];
      const dx = x - entry.centerX;
      const dy = y - entry.centerY;
      const hoverRadius = entry.radius + 6;
      if (dx * dx + dy * dy <= hoverRadius * hoverRadius) {
        return entry;
      }
    }

    return null;
  };

  const showTriggerTooltip = (entry: TriggerBadgeEntry) => {
    const canvas = triggerOverlayCanvas;
    if (!canvas) return;

    hideTriggerTooltip();

    const { centerX, centerY, radius, metadata } = entry;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const header = `${metadata.fieldId}: ${metadata.style.operationLabel}`;
    const affectedLines =
      metadata.affectedFieldIds.length > 0
        ? metadata.affectedFieldIds.map((fieldId) => `• ${fieldId}`)
        : ["• (none)"];
    const tooltipLabel = [header, "Affects:", ...affectedLines].join("\n");
    const paddingLeft = 3;
    const paddingRight = 3;
    const paddingY = 3;
    const maxTextWidth = Math.max(120, canvasWidth - 12 - paddingLeft - paddingRight);
    const baseTextOptions = {
      fontSize: 14,
      fill: "#0f172a",
      lineHeight: 1.35,
      selectable: false,
      evented: false,
      originX: "left" as const,
      originY: "top" as const,
    };

    const measuredText = new FabricText(tooltipLabel, baseTextOptions);
    const measuredWidth = Math.ceil(measuredText.width ?? 0);
    const text: FabricText | Textbox =
      measuredWidth <= maxTextWidth
        ? measuredText
        : new Textbox(tooltipLabel, {
            ...baseTextOptions,
            width: maxTextWidth,
          });

    const textWidth = Math.ceil(text.width ?? maxTextWidth);
    const textHeight = Math.ceil(text.height ?? 18);
    const tooltipWidth = textWidth + paddingLeft + paddingRight;
    const tooltipHeight = textHeight + paddingY * 2;
    const minLeft = 6;
    const maxLeft = Math.max(minLeft, canvasWidth - tooltipWidth - 6);
    const left = Math.max(minLeft, Math.min(centerX - tooltipWidth / 2, maxLeft));

    let preferredTop = centerY + radius + 6;
    if (preferredTop + tooltipHeight > canvasHeight - 6) {
      preferredTop = centerY - radius - tooltipHeight - 6;
    }
    const top = Math.min(
      Math.max(preferredTop, 6),
      Math.max(6, canvasHeight - tooltipHeight - 6),
    );

    const background = new Rect({
      left,
      top,
      originX: "left",
      originY: "top",
      width: tooltipWidth,
      height: tooltipHeight,
      rx: 6,
      ry: 6,
      fill: "rgba(255,255,255,0.96)",
      stroke: "#94a3b8",
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    text.set({
      left: left + paddingLeft,
      top: top + paddingY,
    });

    canvas.add(background);
    canvas.add(text);
    canvas.bringObjectToFront(background);
    canvas.bringObjectToFront(text);

    hoverTooltipRect = background;
    hoverTooltipText = text;
    activeTooltipSignature = `${metadata.fieldId}:${metadata.style.operationLabel}:${centerX}:${centerY}`;
    canvas.requestRenderAll();
  };

  const updateTriggerTooltipForPoint = (x: number, y: number) => {
    const canvas = triggerOverlayCanvas;
    if (!canvas || !props.showTriggers) return;

    const hoveredEntry = resolveHoveredBadgeEntry(x, y);
    if (!hoveredEntry) {
      if (hoverTooltipRect || hoverTooltipText) {
        hideTriggerTooltip();
        canvas.requestRenderAll();
      }
      return;
    }

    const signature = `${hoveredEntry.metadata.fieldId}:${hoveredEntry.metadata.style.operationLabel}:${hoveredEntry.centerX}:${hoveredEntry.centerY}`;
    if (activeTooltipSignature === signature) return;

    showTriggerTooltip(hoveredEntry);
  };

  const ensureTriggerOverlayCanvas = () => {
    const canvasElement = overlayCanvasElement();
    if (!canvasElement) return;

    if (triggerOverlayCanvas && triggerOverlayHost !== canvasElement) {
      hideTriggerTooltip();
      void triggerOverlayCanvas.dispose();
      triggerOverlayCanvas = null;
      triggerOverlayHost = null;
    }

    if (triggerOverlayCanvas) return;

    const canvas = new Canvas(canvasElement, {
      selection: false,
      renderOnAddRemove: false,
    });
    canvas.selection = false;
    canvas.lowerCanvasEl.style.position = "absolute";
    canvas.lowerCanvasEl.style.inset = "0";
    canvas.lowerCanvasEl.style.pointerEvents = "none";
    canvas.upperCanvasEl.style.position = "absolute";
    canvas.upperCanvasEl.style.inset = "0";
    canvas.upperCanvasEl.style.backgroundColor = "transparent";
    canvas.lowerCanvasEl.style.backgroundColor = "transparent";

    triggerOverlayCanvas = canvas;
    triggerOverlayHost = canvasElement;
  };

  const syncOverlayWrapperStyles = () => {
    const canvas = triggerOverlayCanvas;
    if (!canvas) return;

    const wrapper = canvas.wrapperEl;
    wrapper.style.position = "absolute";
    wrapper.style.inset = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.zIndex = "20";
    wrapper.style.pointerEvents = "none";
    wrapper.style.opacity = props.showTriggers ? "1" : "0";
    wrapper.style.transition = "opacity 120ms ease";
    wrapper.style.background = "transparent";

    canvas.upperCanvasEl.style.pointerEvents = "none";
    canvas.upperCanvasEl.style.backgroundColor = "transparent";
    canvas.lowerCanvasEl.style.backgroundColor = "transparent";
    canvas.lowerCanvasEl.style.pointerEvents = "none";
    canvas.upperCanvasEl.style.cursor = "default";

    if (!props.showTriggers && (hoverTooltipRect || hoverTooltipText)) {
      hideTriggerTooltip();
      canvas.requestRenderAll();
    }
  };

  const syncTriggerOverlayCanvasSize = () => {
    const canvas = triggerOverlayCanvas;
    const viewport = viewportElement();
    if (!canvas || !viewport) return;

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (width <= 0 || height <= 0) return;
    if (canvas.getWidth() === width && canvas.getHeight() === height) return;

    canvas.setDimensions({ width, height });
  };

  const renderTriggerOverlay = () => {
    ensureTriggerOverlayCanvas();
    syncOverlayWrapperStyles();
    syncTriggerOverlayCanvasSize();

    const canvas = triggerOverlayCanvas;
    const viewport = viewportElement();
    if (!canvas || !viewport) return;

    canvas.clear();
    triggerBadgeEntries = [];
    hoverTooltipRect = null;
    hoverTooltipText = null;
    activeTooltipSignature = null;
    canvas.upperCanvasEl.style.cursor = "default";

    if (!props.showTriggers) {
      canvas.requestRenderAll();
      return;
    }

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    const viewportRect = viewport.getBoundingClientRect();

    const fieldSlots = viewport.querySelectorAll<HTMLElement>("[data-field-slot-id]");
    const fieldSlotById = new Map<string, HTMLElement>();
    for (const fieldSlot of fieldSlots) {
      const fieldId = fieldSlot.dataset.fieldSlotId;
      if (!fieldId) continue;
      fieldSlotById.set(fieldId, fieldSlot);
    }

    for (const [fieldId, triggerBadges] of triggerBadgesByFieldId().entries()) {
      const fieldSlot = fieldSlotById.get(fieldId);
      if (!fieldSlot) continue;

      const fieldRect = fieldSlot.getBoundingClientRect();
      if (fieldRect.bottom < viewportRect.top || fieldRect.top > viewportRect.bottom) continue;

      const baseX = fieldRect.left - viewportRect.left + 20;
      const centerY = fieldRect.bottom - viewportRect.top + 12;

      triggerBadges.forEach((badgeData, index) => {
        const style = TRIGGER_BADGE_STYLE_BY_KIND[badgeData.kind];
        const centerX = baseX + index * 28;
        const radius = 10;
        if (
          centerX < radius ||
          centerX > canvasWidth - radius ||
          centerY < radius ||
          centerY > canvasHeight - radius
        ) {
          return;
        }

        const circle = new Circle({
          radius,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: 1.5,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });

        const label = new FabricText(style.label, {
          fontSize: 11,
          fontWeight: "700",
          fill: "#ffffff",
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });

        const badge = new Group([circle, label], {
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false,
        });

        canvas.add(badge);
        triggerBadgeEntries.push({
          centerX,
          centerY,
          radius,
          metadata: {
            fieldId,
            style,
            affectedFieldIds: badgeData.affectedFieldIds,
          },
        });
      });
    }

    canvas.requestRenderAll();
  };

  createEffect(() => {
    const nextFormSpec = props.formSpec;
    try {
      const { graph, handlesById: nextHandlesById } = buildGraphFromFormSpec(nextFormSpec);
      setRuntime({
        formSpec: nextFormSpec,
        handlesById: nextHandlesById,
      });
      onCleanup(() => graph.destroy());
    } catch (error) {
      console.error("Unable to build form preview runtime:", error);
      setRuntime({
        formSpec: nextFormSpec,
        handlesById: new Map(),
      });
    }
  });

  createEffect(() => {
    const isShowingTriggers = props.showTriggers;
    if (triggerOverlayCanvas) {
      syncOverlayWrapperStyles();
    }
    runtime();
    triggerBadgesByFieldId();
    if (!isShowingTriggers && !triggerOverlayCanvas) return;
    queueMicrotask(() => renderTriggerOverlay());
  });

  createEffect(() => {
    const viewport = viewportElement();
    const formContent = formContentElement();
    if (!viewport || !formContent) return;

    const handleScroll = () => renderTriggerOverlay();
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    const handleMouseMove = (event: MouseEvent) => {
      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      updateTriggerTooltipForPoint(event.clientX - rect.left, event.clientY - rect.top);
    };
    const handleMouseLeave = () => {
      if (!triggerOverlayCanvas || !props.showTriggers) return;
      if (!hoverTooltipRect && !hoverTooltipText) return;
      hideTriggerTooltip();
      triggerOverlayCanvas.requestRenderAll();
    };
    viewport.addEventListener("mousemove", handleMouseMove, { passive: true });
    viewport.addEventListener("mouseleave", handleMouseLeave);

    const resizeObserver = new ResizeObserver(() => renderTriggerOverlay());
    resizeObserver.observe(viewport);

    const mutationObserver = new MutationObserver(() => renderTriggerOverlay());
    mutationObserver.observe(formContent, {
      subtree: true,
      childList: true,
    });

    onCleanup(() => {
      viewport.removeEventListener("scroll", handleScroll);
      viewport.removeEventListener("mousemove", handleMouseMove);
      viewport.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    });
  });

  onCleanup(() => {
    hideTriggerTooltip();

    if (triggerOverlayCanvas) {
      void triggerOverlayCanvas.dispose();
      triggerOverlayCanvas = null;
      triggerOverlayHost = null;
    }
  });

  return (
    <div class="flex h-full min-h-0 flex-col rounded-lg border border-slate-300 bg-white p-3">
      <div
        ref={setViewportElement}
        class="relative min-h-0 flex-1 overflow-auto overscroll-contain rounded-md border border-slate-200 bg-slate-50 p-4"
      >
        <canvas
          ref={setOverlayCanvasElement}
          class="absolute inset-0 z-20 transition-opacity"
          classList={{
            "pointer-events-auto opacity-100": props.showTriggers,
            "pointer-events-none opacity-0": !props.showTriggers,
          }}
        />

        <div ref={setFormContentElement} class="relative z-10">
          <Show
            when={props.formSpec.fields.length > 0}
            fallback={
              <div class="flex min-h-[220px] select-none items-center justify-center rounded-md border border-dashed border-slate-300 bg-white/70 px-4 text-center text-sm font-medium text-slate-500">
                Interactive form preview
              </div>
            }
          >
            <Show when={runtime()}>
              {(safeRuntime) => (
                <FormRenderer
                  form={safeRuntime().formSpec}
                  handlesById={safeRuntime().handlesById}
                />
              )}
            </Show>
          </Show>
        </div>

        <div class="pointer-events-none absolute bottom-3 right-3 z-30">
          <label class="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
            <input
              type="checkbox"
              class="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={props.showTriggers}
              onInput={(event) => props.onShowTriggersChange(event.currentTarget.checked)}
            />
            show triggers
          </label>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
