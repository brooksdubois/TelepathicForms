export type LaserRingVariant =
  | 'default'
  | 'laser'
  | 'expanse'
  | 'scanner';

export type LaserRingAnimationMode = 'laser' | 'expanse' | 'scanner';

export type LaserRingVariantPreset = {
  mode: LaserRingAnimationMode;
  strokeWidth: number;
  expanseStrokeScale: number;
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

export const DEFAULT_LASER_RING_VARIANT: LaserRingVariant = 'laser';

const LASER_PRESET: LaserRingVariantPreset = {
  mode: 'laser',
  strokeWidth: 2.25,
  expanseStrokeScale: 1,
  segmentMin: 12,
  segmentMax: 24,
  activeMs: 660,
  pxPerMs: 1,
  minMs: 650,
  maxMs: 2600,
  phaseRatio: 0.25,
  fadeKeyframe: 'tf-focus-laser-ring-fade',
  fadeEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
};

const LASER_RING_VARIANTS: Record<LaserRingVariant, LaserRingVariantPreset> = {
  default: LASER_PRESET,
  laser: LASER_PRESET,
  expanse: {
    mode: 'expanse',
    strokeWidth: 2.25,
    expanseStrokeScale: 2.85,
    segmentMin: 0,
    segmentMax: 0,
    activeMs: 360,
    pxPerMs: 1,
    minMs: 360,
    maxMs: 360,
    phaseRatio: 0,
    fadeKeyframe: 'tf-focus-expanse-ring-fade',
    fadeEasing: 'cubic-bezier(0.16, 0.9, 0.27, 1)',
  },
  scanner: {
    mode: 'scanner',
    strokeWidth: 2.3,
    expanseStrokeScale: 1,
    segmentMin: 12,
    segmentMax: 40,
    activeMs: 620,
    pxPerMs: 1,
    minMs: 620,
    maxMs: 620,
    phaseRatio: 0,
    fadeKeyframe: 'tf-focus-scanner-ring-fade',
    fadeEasing: 'cubic-bezier(0.2, 0.72, 0.26, 1)',
  },
};

export function getLaserRingVariantPreset(
  variant: LaserRingVariant | undefined,
): LaserRingVariantPreset {
  if (!variant) return LASER_RING_VARIANTS[DEFAULT_LASER_RING_VARIANT];

  const normalized = variant === 'default' ? 'laser' : variant;
  return LASER_RING_VARIANTS[normalized] ?? LASER_RING_VARIANTS[DEFAULT_LASER_RING_VARIANT];
}

export function listLaserRingVariants(): LaserRingVariant[] {
  return ['laser', 'expanse', 'scanner'];
}
