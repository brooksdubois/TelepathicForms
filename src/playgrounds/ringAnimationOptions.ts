import {listLaserRingVariants, type LaserRingVariant} from '../utils/laserRingVariants';

export type RingAnimationSelection = 'none' | LaserRingVariant;

const RING_ANIMATION_LABELS: Record<LaserRingVariant, string> = {
  default: 'Laser',
  laser: 'Laser',
  swift: 'Laser (Swift)',
  lingering: 'Laser (Lingering)',
  expanse: 'Expanse',
};

export const ringAnimationOptions: Array<{
  value: RingAnimationSelection;
  label: string;
}> = [
  {value: 'none', label: 'None'},
  ...listLaserRingVariants().map((variant) => ({
    value: variant,
    label: RING_ANIMATION_LABELS[variant],
  })),
];

export const ringAnimationEnabled = (selection: RingAnimationSelection) =>
  selection !== 'none';

export const ringAnimationVariant = (
  selection: RingAnimationSelection,
): LaserRingVariant | undefined =>
  selection === 'none' ? undefined : selection;
