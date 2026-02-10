import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import MultiSelect from "../primitives/MultiSelect";
import {fromObservable} from "../utils/fromObservable";

export type MultiSelectWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
  inline?: boolean;
};

const parseSelected = (raw: string): string[] =>
  raw
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

export const MultiSelectWrapper: Component<MultiSelectWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const selectedValues = createMemo(() => parseSelected(value()));

  const options = createMemo(() =>
    (p.spec.options ?? []).map((opt) => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
      group: opt.group,
    }))
  );

  return (
    <MultiSelect
      label={p.spec.label}
      value={selectedValues()}
      options={options()}
      placeholder={p.spec.placeholder}
      helperText={p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      inline={p.inline ?? p.spec.inline}
      size={p.spec.size}
      variant={p.spec.variant}
      searchable={p.spec.searchable}
      clearable={p.spec.clearable}
      maxSelected={p.spec.maxSelected}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => {
        p.field.setValue(next.join(","));
        p.field.markTouched();
      }}
    />
  );
};
