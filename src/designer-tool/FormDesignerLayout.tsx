import { createSignal, onCleanup, onMount, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";

enum DragMode {
  Vertical = "vertical",
  Horizontal = "horizontal",
}

const DEFAULT_LEFT_WIDTH_PX = 480;
const DEFAULT_A_HEIGHT_PX = 260;

const LEFT_MIN_WIDTH_PX = 420;
const RIGHT_MIN_WIDTH_PX = 320;
const A_MIN_HEIGHT_PX = 160;
const B_MIN_HEIGHT_PX = 160;
const SPLITTER_SIZE_PX = 8;
const LAYOUT_MIN_WIDTH_PX =
  LEFT_MIN_WIDTH_PX + SPLITTER_SIZE_PX + RIGHT_MIN_WIDTH_PX;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type SplitterPointerEvent = PointerEvent & {
  currentTarget: HTMLDivElement;
  target: Element;
};

type FormDesignerLayoutProps = {
  leftTop: Component;
  leftBottom: Component;
  right: Component;
};

const FormDesignerLayout: Component<FormDesignerLayoutProps> = (props) => {
  const [leftWidthPx, setLeftWidthPx] = createSignal(DEFAULT_LEFT_WIDTH_PX);
  const [aHeightPx, setAHeightPx] = createSignal(DEFAULT_A_HEIGHT_PX);
  const [dragMode, setDragMode] = createSignal<DragMode | null>(null);
  const [activePointerId, setActivePointerId] = createSignal<number | null>(
    null,
  );
  const [dragStartX, setDragStartX] = createSignal(0);
  const [dragStartY, setDragStartY] = createSignal(0);
  const [startLeftWidthPx, setStartLeftWidthPx] =
    createSignal(DEFAULT_LEFT_WIDTH_PX);
  const [startAHeightPx, setStartAHeightPx] = createSignal(DEFAULT_A_HEIGHT_PX);

  let containerRef: HTMLDivElement | undefined;
  let leftColumnRef: HTMLDivElement | undefined;

  const clampLeftWidth = (nextWidth: number) => {
    const totalWidth = containerRef?.getBoundingClientRect().width ?? window.innerWidth;
    const maxLeftWidth = totalWidth - SPLITTER_SIZE_PX - RIGHT_MIN_WIDTH_PX;
    return clamp(
      nextWidth,
      LEFT_MIN_WIDTH_PX,
      Math.max(LEFT_MIN_WIDTH_PX, maxLeftWidth),
    );
  };

  const clampAHeight = (nextHeight: number) => {
    const totalHeight =
      leftColumnRef?.getBoundingClientRect().height ?? window.innerHeight;
    const maxAHeight = totalHeight - SPLITTER_SIZE_PX - B_MIN_HEIGHT_PX;
    return clamp(
      nextHeight,
      A_MIN_HEIGHT_PX,
      Math.max(A_MIN_HEIGHT_PX, maxAHeight),
    );
  };

  const clampToViewport = () => {
    setLeftWidthPx((current) => clampLeftWidth(current));
    setAHeightPx((current) => clampAHeight(current));
  };

  const beginDrag = (mode: DragMode, event: SplitterPointerEvent) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActivePointerId(event.pointerId);
    setDragMode(mode);
    setDragStartX(event.clientX);
    setDragStartY(event.clientY);
    setStartLeftWidthPx(leftWidthPx());
    setStartAHeightPx(aHeightPx());
  };

  const handlePointerMove = (event: SplitterPointerEvent) => {
    if (activePointerId() !== event.pointerId) return;
    const mode = dragMode();
    if (!mode) return;

    if (mode === DragMode.Vertical) {
      const deltaX = event.clientX - dragStartX();
      setLeftWidthPx(clampLeftWidth(startLeftWidthPx() + deltaX));
      return;
    }

    const deltaY = event.clientY - dragStartY();
    setAHeightPx(clampAHeight(startAHeightPx() + deltaY));
  };

  const stopDrag = (event: SplitterPointerEvent) => {
    if (activePointerId() !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragMode(null);
    setActivePointerId(null);
  };

  onMount(() => {
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
  });

  onCleanup(() => {
    window.removeEventListener("resize", clampToViewport);
  });

  return (
    <main class="h-screen w-full overflow-auto bg-slate-100 p-4">
      <div
        ref={containerRef}
        class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)]"
        classList={{ "select-none": dragMode() !== null }}
        style={{
          "min-width": `${LAYOUT_MIN_WIDTH_PX}px`,
          "grid-template-columns": `${leftWidthPx()}px ${SPLITTER_SIZE_PX}px minmax(${RIGHT_MIN_WIDTH_PX}px, 1fr)`,
        }}
      >
        <div
          ref={leftColumnRef}
          class="grid h-full min-h-0 min-w-0 pr-2"
          style={{
            "grid-template-rows": `${aHeightPx()}px ${SPLITTER_SIZE_PX}px minmax(${B_MIN_HEIGHT_PX}px, 1fr)`,
          }}
        >
          <section class="h-full min-h-0 min-w-0">
            <Dynamic component={props.leftTop} />
          </section>

          <div
            role="separator"
            aria-label="Resize panel A and panel B"
            aria-orientation="horizontal"
            class="cursor-row-resize rounded-md bg-slate-300 transition-colors hover:bg-slate-400/80"
            onPointerDown={(event) => beginDrag(DragMode.Horizontal, event)}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onDblClick={() => setAHeightPx(clampAHeight(DEFAULT_A_HEIGHT_PX))}
          />

          <section class="h-full min-h-0 min-w-0">
            <Dynamic component={props.leftBottom} />
          </section>
        </div>

        <div
          role="separator"
          aria-label="Resize left and right panels"
          aria-orientation="vertical"
          class="cursor-col-resize rounded-md bg-slate-300 transition-colors hover:bg-slate-400/80"
          onPointerDown={(event) => beginDrag(DragMode.Vertical, event)}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onDblClick={() => setLeftWidthPx(clampLeftWidth(DEFAULT_LEFT_WIDTH_PX))}
        />

        <section class="ml-2 h-full min-h-0 min-w-0">
          <Dynamic component={props.right} />
        </section>
      </div>
    </main>
  );
};

export default FormDesignerLayout;
