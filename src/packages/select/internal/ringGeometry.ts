export type RingBox = {w: number; h: number};

export const RING_HOST_INSET_PX = 5;

export function ringMetrics(ringBox: RingBox, inset: number, radius: number) {
  const {w, h} = ringBox;
  const x = inset;
  const y = inset;
  const ww = Math.max(1, w - inset * 2);
  const hh = Math.max(1, h - inset * 2);
  const r = Math.max(0, Math.min(radius, Math.min(ww, hh) / 2));

  return {x, y, ww, hh, r};
}

export function buildRoundedRingPathD(
  ringBox: RingBox,
  inset: number,
  radius: number,
) {
  const {x, y, ww, hh, r} = ringMetrics(ringBox, inset, radius);

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
    'Z',
  ].join(' ');
}

export function expanseCenterInsetForWidth(width: number) {
  return RING_HOST_INSET_PX - width / 2;
}

export function scannerGeometry(ringBox: RingBox, width: number, radius: number) {
  const {w, h} = ringBox;
  const half = width / 2;
  const fieldLeft = RING_HOST_INSET_PX;
  const fieldRight = w - RING_HOST_INSET_PX;
  const fieldTop = RING_HOST_INSET_PX;
  const fieldBottom = h - RING_HOST_INSET_PX;
  const cornerRadius = Math.max(
    0,
    Math.min(radius, Math.min(fieldRight - fieldLeft, fieldBottom - fieldTop) / 2),
  );
  const leftX = Math.max(0, fieldLeft + cornerRadius);
  const rightX = Math.max(leftX + 1, fieldRight - cornerRadius);
  const topY = Math.max(0, fieldTop - half);
  const bottomY = Math.min(h, fieldBottom + half);
  const span = Math.max(1, rightX - leftX);

  return {leftX, rightX, topY, bottomY, span};
}

export function buildScannerPathD(ringBox: RingBox, width: number, radius: number) {
  const {leftX, rightX, topY, bottomY} = scannerGeometry(ringBox, width, radius);
  return [
    `M ${leftX} ${topY}`,
    `H ${rightX}`,
    `M ${leftX} ${bottomY}`,
    `H ${rightX}`,
  ].join(' ');
}
