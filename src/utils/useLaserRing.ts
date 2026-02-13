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
const RING_HOST_INSET_PX = 5;

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
  const isExpanseMode = () => preset().mode === "expanse";
  const isScannerMode = () => preset().mode === "scanner";
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
      laserSegEl.style.filter = "";
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

  const ringMetrics = (inset: number) => {
    const {w, h} = ringBox();
    const x = inset;
    const y = inset;
    const ww = Math.max(1, w - inset * 2);
    const hh = Math.max(1, h - inset * 2);
    const desired = options.radius();
    const r = Math.max(0, Math.min(desired, Math.min(ww, hh) / 2));
    const topStraight = Math.max(1, ww - r * 2);
    const quarterArc = (Math.PI * r) / 2;

    return {x, y, ww, hh, r, topStraight, quarterArc};
  };

  const buildRingPathD = (inset: number) => {
    const {x, y, ww, hh, r} = ringMetrics(inset);

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

  const expanseCenterInsetForWidth = (width: number) =>
    RING_HOST_INSET_PX - width / 2;

  const buildScannerPathD = (inset: number) => {
    const {x, y, ww, hh} = ringMetrics(inset);

    // Box-style scanner path: straight top + bottom runs, no corner arcs.
    return [
      `M ${x} ${y}`,
      `H ${x + ww}`,
      `M ${x} ${y + hh}`,
      `H ${x + ww}`,
    ].join(" ");
  };

  const ringPathD = () => {
    if (isExpanseMode()) {
      return buildRingPathD(expanseCenterInsetForWidth(strokeWidth()));
    }

    if (isScannerMode()) {
      return buildScannerPathD(strokeWidth() / 2);
    }

    return buildRingPathD(strokeWidth() / 2);
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
    seg.style.filter = "";

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const travel = len * t;
      seg.style.strokeDashoffset = `${-(phase + travel)}`;

      if (t < 1) ringRaf = requestAnimationFrame(tick);
    };

    ringRaf = requestAnimationFrame(tick);
    return true;
  };

  const startScannerAnimation = () => {
    const path = measureEl;
    const seg = laserSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const durationMs = Math.max(1, activeMs());
    const inset = strokeWidth() / 2;
    const metrics = ringMetrics(inset);
    const edgeLen = Math.max(1, metrics.ww);
    const minSweep = Math.max(8, Math.min(segmentMin(), edgeLen * 0.2));
    const maxSweep = Math.max(
      minSweep + 5,
      Math.min(segmentMax(), edgeLen * 0.42),
    );
    const start = performance.now();
    const scannerPathD = buildScannerPathD(inset);

    path.setAttribute("d", scannerPathD);
    seg.setAttribute("d", scannerPathD);
    seg.style.strokeWidth = `${strokeWidth()}`;
    seg.style.filter = "drop-shadow(0 0 1px currentColor)";

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const travelT = t * t;
      const bulgeT = 0.18 + t * 0.82;
      const bulge = Math.pow(Math.sin(Math.PI * bulgeT), 1.2);
      const sweep = minSweep + (maxSweep - minSweep) * bulge;
      const head = travelT * (edgeLen + sweep);
      const sweepStart = Math.max(0, Math.min(edgeLen - sweep, head - sweep));
      const gap = Math.max(1, edgeLen - sweep);

      // Dash pattern duplicated for top and bottom subpaths to keep both in sync.
      seg.style.strokeDasharray = `${sweep} ${gap} ${sweep} ${gap}`;
      seg.style.strokeDashoffset = `${-sweepStart}`;
      seg.style.filter = `drop-shadow(0 0 ${1 + 1.8 * bulge}px currentColor)`;

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

    const durationMs = Math.max(1, activeMs());
    const startWidth = strokeWidth();
    const endWidth = startWidth * expanseStrokeScale();
    const start = performance.now();

    seg.style.strokeDasharray = "";
    seg.style.strokeDashoffset = "";
    seg.style.strokeWidth = `${startWidth}`;
    seg.style.filter = "drop-shadow(0 0 0.7px currentColor)";
    seg.setAttribute("d", buildRingPathD(expanseCenterInsetForWidth(startWidth)));

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const widthProgress = Math.min(1, t * 1.28);
      const eased = 1 - Math.pow(1 - widthProgress, 4);
      const width = startWidth + (endWidth - startWidth) * eased;
      seg.style.strokeWidth = `${width}`;
      seg.setAttribute("d", buildRingPathD(expanseCenterInsetForWidth(width)));
      seg.style.filter = `drop-shadow(0 0 ${0.7 + 2.6 * eased}px currentColor)`;

      if (t < 1) ringRaf = requestAnimationFrame(tick);
    };

    ringRaf = requestAnimationFrame(tick);

    return true;
  };

  const startVariantAnimation = () => {
    if (isExpanseMode()) return startExpanseAnimation();
    if (isScannerMode()) return startScannerAnimation();
    return startLaserAnimation();
  };

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
