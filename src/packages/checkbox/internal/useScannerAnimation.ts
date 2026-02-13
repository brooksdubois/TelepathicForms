import {createEffect, createSignal, onCleanup, type Accessor} from 'solid-js';
import {buildScannerPathD, scannerGeometry, type RingBox} from './ringGeometry';

type UseScannerAnimationOptions = {
  enabled: Accessor<boolean>;
  radius: Accessor<number>;
  strokeWidth?: Accessor<number>;
  segmentMin?: Accessor<number>;
  segmentMax?: Accessor<number>;
  activeMs?: Accessor<number>;
  fadeKeyframe?: Accessor<string>;
  fadeEasing?: Accessor<string>;
};

export function useScannerAnimation(options: UseScannerAnimationOptions) {
  const strokeWidth = () => options.strokeWidth?.() ?? 2.3;
  const segmentMin = () => options.segmentMin?.() ?? 12;
  const segmentMax = () => options.segmentMax?.() ?? 40;
  const activeMs = () => options.activeMs?.() ?? 620;
  const fadeKeyframe = () => options.fadeKeyframe?.() ?? 'tf-focus-scanner-ring-fade';
  const fadeEasing = () =>
    options.fadeEasing?.() ?? 'cubic-bezier(0.2, 0.72, 0.26, 1)';
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

  const ringPathD = () => buildScannerPathD(ringBox(), strokeWidth(), options.radius());

  const startScannerAnimation = () => {
    const path = measureEl;
    const seg = laserSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const durationMs = Math.max(1, activeMs());
    const width = strokeWidth();
    const geometry = scannerGeometry(ringBox(), width, options.radius());
    const edgeLen = geometry.span;
    const minSweep = Math.max(8, Math.min(segmentMin(), edgeLen * 0.2));
    const maxSweep = Math.max(
      minSweep + 5,
      Math.min(segmentMax(), edgeLen * 0.42),
    );
    const start = performance.now();
    const scannerPathD = buildScannerPathD(ringBox(), width, options.radius());

    path.setAttribute('d', scannerPathD);
    seg.setAttribute('d', scannerPathD);
    seg.style.strokeWidth = `${width}`;
    seg.style.filter = 'drop-shadow(0 0 1px currentColor)';
    seg.style.strokeLinecap = 'butt';

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const travelT = t * t;
      const bulgeT = 0.18 + t * 0.82;
      const bulge = Math.pow(Math.sin(Math.PI * bulgeT), 1.2);
      const sweep = minSweep + (maxSweep - minSweep) * bulge;
      const head = travelT * (edgeLen + sweep);
      const sweepStart = Math.max(0, Math.min(edgeLen - sweep, head - sweep));
      const gap = Math.max(1, edgeLen - sweep);

      seg.style.strokeDasharray = `${sweep} ${gap} ${sweep} ${gap}`;
      seg.style.strokeDashoffset = `${-sweepStart}`;
      seg.style.filter = `drop-shadow(0 0 ${1 + 1.8 * bulge}px currentColor)`;

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
          if (startScannerAnimation()) return;
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
