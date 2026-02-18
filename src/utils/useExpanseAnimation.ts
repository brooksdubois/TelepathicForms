import {createEffect, createSignal, onCleanup, type Accessor} from 'solid-js';
import {
  buildRoundedRingPathD,
  expanseCenterInsetForWidth,
  type RingBox,
} from './ringGeometry';

type UseExpanseAnimationOptions = {
  enabled: Accessor<boolean>;
  radius: Accessor<number>;
  strokeWidth?: Accessor<number>;
  expanseStrokeScale?: Accessor<number>;
  activeMs?: Accessor<number>;
  fadeKeyframe?: Accessor<string>;
  fadeEasing?: Accessor<string>;
};

export function useExpanseAnimation(options: UseExpanseAnimationOptions) {
  const strokeWidth = () => options.strokeWidth?.() ?? 2.25;
  const expanseStrokeScale = () => options.expanseStrokeScale?.() ?? 2.85;
  const activeMs = () => options.activeMs?.() ?? 360;
  const fadeKeyframe = () => options.fadeKeyframe?.() ?? 'tf-focus-expanse-ring-fade';
  const fadeEasing = () =>
    options.fadeEasing?.() ?? 'cubic-bezier(0.16, 0.9, 0.27, 1)';
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
    buildRoundedRingPathD(
      ringBox(),
      expanseCenterInsetForWidth(strokeWidth()),
      options.radius(),
    );

  const startExpanseAnimation = () => {
    const path = measureEl;
    const seg = laserSegEl;
    if (!path || !seg) return false;

    stopAnimation();

    const durationMs = Math.max(1, activeMs());
    const startWidth = strokeWidth();
    const endWidth = startWidth * expanseStrokeScale();
    const start = performance.now();

    seg.style.strokeDasharray = '';
    seg.style.strokeDashoffset = '';
    seg.style.strokeWidth = `${startWidth}`;
    seg.style.filter = 'drop-shadow(0 0 0.7px currentColor)';
    seg.style.strokeLinecap = '';
    seg.setAttribute(
      'd',
      buildRoundedRingPathD(
        ringBox(),
        expanseCenterInsetForWidth(startWidth),
        options.radius(),
      ),
    );

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const widthProgress = Math.min(1, t * 1.28);
      const eased = 1 - Math.pow(1 - widthProgress, 4);
      const width = startWidth + (endWidth - startWidth) * eased;
      seg.style.strokeWidth = `${width}`;
      seg.setAttribute(
        'd',
        buildRoundedRingPathD(
          ringBox(),
          expanseCenterInsetForWidth(width),
          options.radius(),
        ),
      );
      seg.style.filter = `drop-shadow(0 0 ${0.7 + 2.6 * eased}px currentColor)`;

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
          if (startExpanseAnimation()) return;
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
