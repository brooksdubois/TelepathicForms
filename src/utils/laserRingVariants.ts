export type LaserRingVariant = 'default' | 'swift' | 'lingering';

export type LaserRingVariantPreset = {
  strokeWidth: number;
  segmentMin: number;
  segmentMax: number;
  activeMs: number;
  pxPerMs: number;
  minMs: number;
  maxMs: number;
  phaseRatio: number;
  fadeKeyframe: string;
  fadeEasing: string;
};

export const DEFAULT_LASER_RING_VARIANT: LaserRingVariant = 'default';

const LASER_RING_VARIANTS: Record<LaserRingVariant, LaserRingVariantPreset> = {
  default: {
    strokeWidth: 2.25,
    segmentMin: 12,
    segmentMax: 24,
    activeMs: 660,
    pxPerMs: 1,
    minMs: 650,
    maxMs: 2600,
    phaseRatio: 0.25,
    fadeKeyframe: 'tf-focus-laser-ring-fade',
    fadeEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  },
  swift: {
    strokeWidth: 2.25,
    segmentMin: 10,
    segmentMax: 20,
    activeMs: 520,
    pxPerMs: 1.35,
    minMs: 480,
    maxMs: 1800,
    phaseRatio: 0.22,
    fadeKeyframe: 'tf-focus-laser-ring-fade',
    fadeEasing: 'cubic-bezier(0.2, 0.7, 0.28, 1)',
  },
  lingering: {
    strokeWidth: 2.25,
    segmentMin: 14,
    segmentMax: 30,
    activeMs: 820,
    pxPerMs: 0.82,
    minMs: 760,
    maxMs: 3200,
    phaseRatio: 0.3,
    fadeKeyframe: 'tf-focus-laser-ring-fade',
    fadeEasing: 'cubic-bezier(0.19, 0.68, 0.28, 1)',
  },
};

export function getLaserRingVariantPreset(
  variant: LaserRingVariant | undefined,
): LaserRingVariantPreset {
  if (!variant) return LASER_RING_VARIANTS[DEFAULT_LASER_RING_VARIANT];
  return LASER_RING_VARIANTS[variant] ?? LASER_RING_VARIANTS[DEFAULT_LASER_RING_VARIANT];
}

export function listLaserRingVariants(): LaserRingVariant[] {
  return Object.keys(LASER_RING_VARIANTS) as LaserRingVariant[];
}
