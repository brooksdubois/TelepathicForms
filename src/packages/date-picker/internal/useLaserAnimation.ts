import {createEffect, createSignal, onCleanup, type Accessor} from 'solid-js';
import {buildRoundedRingPathD, type RingBox} from './ringGeometry';

type UseLaserAnimationOptions = {
  enabled: Accessor<boolean>;
  radius: Accessor<number>;
  strokeWidth?: Accessor<number>;
  segmentMin?: Accessor<number>;
  segmentMax?: Accessor<number>;
  activeMs?: Accessor<number>;
  pxPerMs?: Accessor<number>;
  minMs?: Accessor<number>;
  maxMs?: Accessor<number>;
  phaseRatio?: Accessor<number>;
  fadeKeyframe?: Accessor<string>;
  fadeEasing?: Accessor<string>;
};

export function useLaserAnimation(options: UseLaserAnimationOptions) {
  const strokeWidth = () => options.strokeWidth?.() ?? 2.25;
  const segmentMin = () => options.segmentMin?.() ?? 12;
  const segmentMax = () => options.segmentMax?.() ?? 24;
  const activeMs = () => options.activeMs?.() ?? 660;
  const pxPerMs = () => options.pxPerMs?.() ?? 1;
  const minMs = () => options.minMs?.() ?? 650;
  const maxMs = () => options.maxMs?.() ?? 2600;
  const phaseRatio = () => options.phaseRatio?.() ?? 0.25;
  const fadeKeyframe = () => options.fadeKeyframe?.() ?? 'tf-focus-laser-ring-fade';
  const fadeEasing = () =>
    options.fadeEasing?.() ?? 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const ringFadeAnimation = () =>
    `${fadeKeyframe()} ${activeMs()}ms ${fadeEasing()} forwards`;

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
      laserSegEl.style.strokeDasharray = '';
      laserSegEl.style.strokeDashoffset = '';
      laserSegEl.style.strokeWidth = '';
      laserSegEl.style.filter = '';
      laserSegEl.style.strokeLinecap = '';
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

  const ringPathD = () =>
    buildRoundedRingPathD(ringBox(), strokeWidth() / 2, options.radius());

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

    seg.setAttribute('d', ringPathD());
    seg.style.strokeDasharray = `${segLen} ${dashGap}`;
    seg.style.strokeDashoffset = `${-phase}`;
    seg.style.strokeWidth = '';
    seg.style.filter = '';
    seg.style.strokeLinecap = '';

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const travel = len * t;
      seg.style.strokeDashoffset = `${-(phase + travel)}`;

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
          if (startLaserAnimation()) return;
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
