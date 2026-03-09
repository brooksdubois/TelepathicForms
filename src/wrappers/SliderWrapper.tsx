import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import Slider from "../primitives/Slider";
import {fromObservable} from "../utils/fromObservable";

export type SliderWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const normalizeMode = (
  mode: FieldSpec["mode"],
): NonNullable<FieldSpec["mode"]> => {
  return mode === "range" || mode === "stepper" ? mode : "single";
};

const normalizeRangeBounds = (min: number, max: number): [number, number] => {
  return min <= max ? [min, max] : [max, min];
};

const parseNumeric = (value: string, fallback: number) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const parseStoredValue = (
  value: string,
  mode: NonNullable<FieldSpec["mode"]>,
  min: number,
  max: number,
): number | [number, number] => {
  const fallbackRange: [number, number] = [min, max];

  if (mode === "range") {
    if (value.trim().length > 0) {
      try {
        const parsed = JSON.parse(value);
        if (
          Array.isArray(parsed) &&
          parsed.length === 2 &&
          typeof parsed[0] === "number" &&
          typeof parsed[1] === "number"
        ) {
          return [
            clamp(parsed[0], min, max),
            clamp(parsed[1], min, max),
          ].sort((left, right) => left - right) as [number, number];
        }
      } catch {
        const [left, right] = value.split(",").map((token) => token.trim());
        const nextLeft = left ? clamp(parseNumeric(left, min), min, max) : min;
        const nextRight = right ? clamp(parseNumeric(right, max), min, max) : max;
        return nextLeft <= nextRight
          ? [nextLeft, nextRight]
          : [nextRight, nextLeft];
      }
    }
    return fallbackRange;
  }

  return clamp(parseNumeric(value, min), min, max);
};

const parseMagneticPoints = (
  raw: unknown,
  min: number,
  max: number,
): number[] => {
  const points: unknown[] = [];

  if (typeof raw === "number" && Number.isFinite(raw)) {
    points.push(raw);
  } else if (Array.isArray(raw)) {
    points.push(...raw);
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        points.push(...parsed);
      } else {
        points.push(...trimmed.split(","));
      }
    } catch {
      points.push(...trimmed.split(","));
    }
  }

  const normalized = points
    .map((point) => Number(point))
    .filter(Number.isFinite)
    .map((point) => clamp(point, min, max))
    .filter((point) => point >= min && point <= max)
    .sort((left, right) => left - right);

  const unique: number[] = [];
  for (const point of normalized) {
    if (unique.length === 0 || point !== unique[unique.length - 1]) {
      unique.push(point);
    }
  }

  return unique;
};

const serializeValue = (value: number | [number, number]) => {
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
};

export const SliderWrapper: Component<SliderWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const mode = () => normalizeMode(p.spec.mode);
  const min = () =>
    typeof p.spec.min === "number" && Number.isFinite(p.spec.min) ? p.spec.min : 0;
  const max = () =>
    typeof p.spec.max === "number" && Number.isFinite(p.spec.max)
      ? p.spec.max
      : 100;
  const step = () =>
    p.spec.step === null
      ? 0
      : typeof p.spec.step === "number" && Number.isFinite(p.spec.step)
      ? p.spec.step
      : 1;

  const bounds = createMemo(() => normalizeRangeBounds(min(), max()));
  const magneticPoints = createMemo(() =>
    parseMagneticPoints(p.spec.magneticPoints, bounds()[0], bounds()[1]),
  );
  const normalizedValue = createMemo(() =>
    parseStoredValue(value(), mode(), bounds()[0], bounds()[1]),
  );
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : "",
  );

  return (
    <Slider
      id={p.spec.id}
      label={p.spec.label}
      value={normalizedValue()}
      helperText={p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      min={bounds()[0]}
      max={bounds()[1]}
      step={step()}
      mode={mode()}
      magneticPoints={magneticPoints()}
      showValue={p.spec.showValue}
      showInput={p.spec.showInput}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => {
        p.field.setValue(serializeValue(next));
        p.field.markTouched();
      }}
    />
  );
};
