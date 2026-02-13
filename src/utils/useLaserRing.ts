import {createEffect, createSignal, onCleanup, type Accessor} from "solid-js";
import {
  getLaserRingVariantPreset,
  type LaserRingVariant,
} from "./laserRingVariants";

type UseLaserRingOptions = {
  enabled: Accessor<boolean>;
  radius: Accessor<number>;
  variant?: Accessor<LaserRingVariant | undefined>;
  strokeWidth?: number;
  segmentMin?: number;
  segmentMax?: number;
  activeMs?: number;
  pxPerMs?: number;
  minMs?: number;
  maxMs?: number;
  phaseRatio?: number;
};

type RingBox = {w: number; h: number};

export function useLaserRing(options: UseLaserRingOptions) {
  const preset = () => getLaserRingVariantPreset(options.variant?.());
  const strokeWidth = () => options.strokeWidth ?? preset().strokeWidth;
  const segmentMin = () => options.segmentMin ?? preset().segmentMin;
  const segmentMax = () => options.segmentMax ?? preset().segmentMax;
  const activeMs = () => options.activeMs ?? preset().activeMs;
  const expanseStrokeScale = () => preset().expanseStrokeScale;
  const pxPerMs = () => options.pxPerMs ?? preset().pxPerMs;
  const minMs = () => options.minMs ?? preset().minMs;
  const maxMs = () => options.maxMs ?? preset().maxMs;
  const phaseRatio = () => options.phaseRatio ?? preset().phaseRatio;
  const usesLaserSegment = () => preset().mode === "laser";
  const ringFadeAnimation = () =>
    `${preset().fadeKeyframe} ${activeMs()}ms ${preset().fadeEasing} forwards`;

  const [hostEl, setHostEl] = createSignal<HTMLElement | undefined>(undefined);
  let measureEl: SVGPathElement | undefined;
  let laserSegEl: SVGPathElement | undefined;
  let ringRaf: number | undefined;
  let ringTimer: number | undefined;

  const [ringBox, setRingBox] = createSignal<RingBox>({w: 100, h: 100});
  const [ringPulseKey, setRingPulseKey] = createSignal(0);
  const [ringActive, setRingActive] = createSignal(false);

  const stopAnimation = () => {
    if (ringRaf !== undefined) {
      cancelAnimationFrame(ringRaf);
      ringRaf = undefined;
    }
    if (ringTimer !== undefined) {
      window.clearTimeout(ringTimer);
      ringTimer = undefined;
    }
    if (laserSegEl) {
      laserSegEl.style.strokeDasharray = "";
      laserSegEl.style.strokeDashoffset = "";
      laserSegEl.style.strokeWidth = "";
    }
  };

  createEffect(() => {
    if (!options.enabled()) return;
    const host = hostEl();
    if (!host) return;

    const update = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      setRingBox({w, h});
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  });

  createEffect(() => {
    if (options.enabled()) return;
    setRingActive(false);
    stopAnimation();
  });

  const ringPathD = () => {
    const {w, h} = ringBox();
    const stroke = strokeWidth();
    const x = stroke / 2;
    const y = stroke / 2;
    const ww = Math.max(1, w - stroke);
    const hh = Math.max(1, h - stroke);
    const desired = options.radius();
    const r = Math.max(0, Math.min(desired, Math.min(ww, hh) / 2));

    return [
      `M ${x + r} ${y}`,
      `H ${x + ww - r}`,
      `A ${r} ${r} 0 0 1 ${x + ww} ${y + r}`,
      `V ${y + hh - r}`,
      `A ${r} ${r} 0 0 1 ${x + ww - r} ${y + hh}`,
      `H ${x + r}`,
      `A ${r} ${r} 0 0 1 ${x} ${y + hh - r}`,
      `V ${y + r}`,
      `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
      "Z",
    ].join(" ");
  };

  const startLaserAnimation = () => {
    const path = measureEl;
    const seg = laserSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const len = Math.max(1, path.getTotalLength());
    const phase = len * phaseRatio();
    const segLen = Math.max(segmentMin(), Math.min(segmentMax(), ringBox().h * 0.55));
    const durationMs = Math.max(minMs(), Math.min(maxMs(), len / pxPerMs()));
    const start = performance.now();
    const dashGap = Math.max(1, len - segLen);

    seg.setAttribute("d", ringPathD());
    seg.style.strokeDasharray = `${segLen} ${dashGap}`;
    seg.style.strokeDashoffset = `${-phase}`;
    seg.style.strokeWidth = "";

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const travel = len * t;
      seg.style.strokeDashoffset = `${-(phase + travel)}`;

      if (t < 1) ringRaf = requestAnimationFrame(tick);
    };

    ringRaf = requestAnimationFrame(tick);
    return true;
  };

  const startExpanseAnimation = () => {
    const path = measureEl;
    const seg = laserSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const len = Math.max(1, path.getTotalLength());
    const durationMs = Math.max(1, activeMs());
    const startWidth = strokeWidth();
    const endWidth = startWidth * expanseStrokeScale();
    const start = performance.now();

    seg.setAttribute("d", ringPathD());
    seg.style.strokeDasharray = `${len} 0`;
    seg.style.strokeDashoffset = "0";
    seg.style.strokeWidth = `${startWidth}`;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const widthProgress = Math.min(1, t * 1.28);
      const eased = 1 - Math.pow(1 - widthProgress, 4);
      const width = startWidth + (endWidth - startWidth) * eased;
      seg.style.strokeWidth = `${width}`;

      if (t < 1) ringRaf = requestAnimationFrame(tick);
    };

    ringRaf = requestAnimationFrame(tick);

    return true;
  };

  const startVariantAnimation = () =>
    usesLaserSegment() ? startLaserAnimation() : startExpanseAnimation();

  const pulseRing = () => {
    if (!options.enabled()) return;

    setRingActive(false);
    stopAnimation();
    setRingPulseKey((k) => k + 1);

    requestAnimationFrame(() => {
      setRingActive(true);

      requestAnimationFrame(() => {
        let attempts = 0;
        const tryStart = () => {
          if (startVariantAnimation()) return;
          attempts += 1;
          if (attempts < 3) requestAnimationFrame(tryStart);
        };
        tryStart();
      });

      ringTimer = window.setTimeout(() => {
        setRingActive(false);
      }, activeMs());
    });
  };

  onCleanup(() => {
    stopAnimation();
  });

  return {
    ringBox,
    ringPathD,
    ringPulseKey,
    ringActive,
    ringFadeAnimation,
    pulseRing,
    setRingHostEl: setHostEl,
    setRingMeasureEl: (el: SVGPathElement | undefined) => {
      measureEl = el;
    },
    setRingLaserSegEl: (el: SVGPathElement | undefined) => {
      laserSegEl = el;
    },
  };
}
