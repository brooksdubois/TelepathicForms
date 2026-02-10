import {createEffect, createSignal, onCleanup, type Accessor} from "solid-js";

type UseAntRingOptions = {
  enabled: Accessor<boolean>;
  radius: Accessor<number>;
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

export function useAntRing(options: UseAntRingOptions) {
  const strokeWidth = () => options.strokeWidth ?? 2.25;
  const segmentMin = () => options.segmentMin ?? 12;
  const segmentMax = () => options.segmentMax ?? 24;
  const activeMs = () => options.activeMs ?? 660;
  const pxPerMs = () => options.pxPerMs ?? 1;
  const minMs = () => options.minMs ?? 650;
  const maxMs = () => options.maxMs ?? 2600;
  const phaseRatio = () => options.phaseRatio ?? 0.25;

  const [hostEl, setHostEl] = createSignal<HTMLElement | undefined>(undefined);
  let measureEl: SVGPathElement | undefined;
  let antSegEl: SVGPathElement | undefined;
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

  const startAntAnimation = () => {
    const path = measureEl;
    const seg = antSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const len = Math.max(1, path.getTotalLength());
    const phase = len * phaseRatio();
    const segLen = Math.max(segmentMin(), Math.min(segmentMax(), ringBox().h * 0.55));
    const durationMs = Math.max(minMs(), Math.min(maxMs(), len / pxPerMs()));
    const start = performance.now();

    const point = (at: number) => path.getPointAtLength(at);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const s0 = (phase + len * t) % len;
      const e0 = s0 + segLen;
      const e = Math.min(e0, len);

      const p0 = point(s0);
      const p1 = point(s0 + (e - s0) / 3);
      const p2 = point(s0 + ((e - s0) * 2) / 3);
      const p3 = point(e);

      seg.setAttribute("d", `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`);

      if (t < 1) ringRaf = requestAnimationFrame(tick);
    };

    ringRaf = requestAnimationFrame(tick);
    return true;
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
          if (startAntAnimation()) return;
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
    pulseRing,
    setRingHostEl: setHostEl,
    setRingMeasureEl: (el: SVGPathElement | undefined) => {
      measureEl = el;
    },
    setRingAntSegEl: (el: SVGPathElement | undefined) => {
      antSegEl = el;
    },
  };
}
