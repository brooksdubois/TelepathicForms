import type {Accessor} from 'solid-js';
import {getLaserRingVariantPreset, type LaserRingVariant} from './laserRingVariants';
import {useExpanseAnimation} from './useExpanseAnimation';
import {useLaserAnimation} from './useLaserAnimation';
import {useScannerAnimation} from './useScannerAnimation';

type UseRingAnimationOptions = {
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
  expanseStrokeScale?: number;
};

type RingVariantMode = 'laser' | 'expanse' | 'scanner';

export function useRingAnimation(options: UseRingAnimationOptions) {
  const activeVariant = (): RingVariantMode => {
    const raw = options.variant?.();
    if (!raw || raw === 'default') return 'laser';
    return raw;
  };

  const preset = () => getLaserRingVariantPreset(activeVariant());

  const laser = useLaserAnimation({
    enabled: () => options.enabled() && activeVariant() === 'laser',
    radius: options.radius,
    strokeWidth: () => options.strokeWidth ?? preset().strokeWidth,
    segmentMin: () => options.segmentMin ?? preset().segmentMin,
    segmentMax: () => options.segmentMax ?? preset().segmentMax,
    activeMs: () => options.activeMs ?? preset().activeMs,
    pxPerMs: () => options.pxPerMs ?? preset().pxPerMs,
    minMs: () => options.minMs ?? preset().minMs,
    maxMs: () => options.maxMs ?? preset().maxMs,
    phaseRatio: () => options.phaseRatio ?? preset().phaseRatio,
    fadeKeyframe: () => preset().fadeKeyframe,
    fadeEasing: () => preset().fadeEasing,
  });

  const expanse = useExpanseAnimation({
    enabled: () => options.enabled() && activeVariant() === 'expanse',
    radius: options.radius,
    strokeWidth: () => options.strokeWidth ?? preset().strokeWidth,
    expanseStrokeScale: () =>
      options.expanseStrokeScale ?? preset().expanseStrokeScale,
    activeMs: () => options.activeMs ?? preset().activeMs,
    fadeKeyframe: () => preset().fadeKeyframe,
    fadeEasing: () => preset().fadeEasing,
  });

  const scanner = useScannerAnimation({
    enabled: () => options.enabled() && activeVariant() === 'scanner',
    radius: options.radius,
    strokeWidth: () => options.strokeWidth ?? preset().strokeWidth,
    segmentMin: () => options.segmentMin ?? preset().segmentMin,
    segmentMax: () => options.segmentMax ?? preset().segmentMax,
    activeMs: () => options.activeMs ?? preset().activeMs,
    fadeKeyframe: () => preset().fadeKeyframe,
    fadeEasing: () => preset().fadeEasing,
  });

  const active = () => {
    const variant = activeVariant();
    if (variant === 'expanse') return expanse;
    if (variant === 'scanner') return scanner;
    return laser;
  };

  return {
    ringBox: () => active().ringBox(),
    ringPathD: () => active().ringPathD(),
    ringPulseKey: () => active().ringPulseKey(),
    ringActive: () => active().ringActive(),
    ringFadeAnimation: () => active().ringFadeAnimation(),
    pulseRing: () => active().pulseRing(),
    setRingHostEl: (el: HTMLElement | undefined) => {
      laser.setRingHostEl(el);
      expanse.setRingHostEl(el);
      scanner.setRingHostEl(el);
    },
    setRingMeasureEl: (el: SVGPathElement | undefined) => {
      laser.setRingMeasureEl(el);
      expanse.setRingMeasureEl(el);
      scanner.setRingMeasureEl(el);
    },
    setRingLaserSegEl: (el: SVGPathElement | undefined) => {
      laser.setRingLaserSegEl(el);
      expanse.setRingLaserSegEl(el);
      scanner.setRingLaserSegEl(el);
    },
  };
}
