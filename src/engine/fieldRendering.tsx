import {Show, type Component} from "solid-js";
import {
  CheckboxWrapper,
  CurrencyWrapper,
  MultiSelectWrapper,
  NumberWrapper,
  PasswordWrapper,
  PercentWrapper,
  PhoneWrapper,
  RadioGroupWrapper,
  SelectWrapper,
  SsnWrapper,
  SwitchWrapper,
  TextAreaWrapper,
  TextFieldWrapper,
  ZipWrapper,
} from "../newWrappers";
import {fromObservable} from "../utils/fromObservable";
import {FieldKind, type FieldHandle, type FieldSpec} from "./types";

export type RowGroup = {
  key: string;
  fields: FieldSpec[];
  sharedRow: boolean;
};

export function groupFieldsByRow(fields: FieldSpec[]): RowGroup[] {
  const groups: RowGroup[] = [];
  const groupsByRow = new Map<number, RowGroup>();

  fields.forEach((field, index) => {
    if (typeof field.row === "number") {
      const existing = groupsByRow.get(field.row);
      if (existing) {
        existing.fields.push(field);
        return;
      }

      const nextGroup: RowGroup = {
        key: `row-${field.row}`,
        fields: [field],
        sharedRow: true,
      };
      groupsByRow.set(field.row, nextGroup);
      groups.push(nextGroup);
      return;
    }

    groups.push({
      key: `field-${field.id}-${index}`,
      fields: [field],
      sharedRow: false,
    });
  });

  return groups;
}

export type FieldSlotProps = {
  f: FieldSpec;
  handle: FieldHandle;
  fullWidth?: boolean;
  wrapInRow?: boolean;
};

export const FieldSlot: Component<FieldSlotProps> = (p) => {
  const hidden = fromObservable(p.handle.hidden$, false);
  const content = (() => {
    const f = p.f;
    const handle = p.handle;

    switch (f.kind) {
      case FieldKind.textArea:
        return <TextAreaWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.phone:
        return <PhoneWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.number:
        return <NumberWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.currency:
        return <CurrencyWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.percent:
        return <PercentWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.select:
        return <SelectWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.multiSelect:
        return <MultiSelectWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.checkbox:
        return <CheckboxWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.inlineCheckbox:
        return <CheckboxWrapper spec={f} field={handle} fullWidth={p.fullWidth} inline={true} />;

      case FieldKind.switch:
        return <SwitchWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.radio:
        return <RadioGroupWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.inlineRadio:
        return <RadioGroupWrapper spec={f} field={handle} fullWidth={p.fullWidth} inline={true} />;

      case FieldKind.ssn:
        return <SsnWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.zip:
        return <ZipWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.password:
        return <PasswordWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.text:
      default:
        return <TextFieldWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;
    }
  })();

  return (
    <Show when={!hidden()} fallback={null}>
      {p.wrapInRow ? (
        <div style={{flex: "1 1 0", "min-width": "240px"}}>{content}</div>
      ) : (
        content
      )}
    </Show>
  );
};
