import { type Component } from "solid-js";
import { Transition } from "solid-transition-group";
import {
  CheckboxWrapper,
  CurrencyWrapper,
  DatePickerWrapper,
  DateRangePickerWrapper,
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
} from "../wrappers";
import {fromObservable} from "../utils/fromObservable";
import {FieldKind, type FieldHandle, type FieldSpec} from "./types";

export type RowGroup = {
  key: string;
  fields: FieldSpec[];
  sharedRow: boolean;
};

export function groupFieldsByRow(fields: FieldSpec[]): RowGroup[] {
  const groupsByRow = new Map<number, FieldSpec[]>();
  const unassignedGroups: RowGroup[] = [];

  fields.forEach((field, index) => {
    if (typeof field.row === "number") {
      const existing = groupsByRow.get(field.row) ?? [];
      groupsByRow.set(field.row, [...existing, field]);
      return;
    }

    unassignedGroups.push({
      key: `field-${field.id}-${index}`,
      fields: [field],
      sharedRow: false,
    });
  });

  const orderedRowGroups: RowGroup[] = [...groupsByRow.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rowNumber, rowFields]) => ({
      key: `row-${rowNumber}`,
      fields: rowFields,
      sharedRow: true,
    }));

  return [...orderedRowGroups, ...unassignedGroups];
}

export type FieldSlotProps = {
  f: FieldSpec;
  handle: FieldHandle;
  fullWidth?: boolean;
  wrapInRow?: boolean;
};

export const FieldSlot: Component<FieldSlotProps> = (p) => {
  const hidden = fromObservable(p.handle.hidden$, false);
  const ENTER_MS = 180;
  const EXIT_MS = 140;
  const ENTER_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
  const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";

  const clearSlotInlineStyles = (el: HTMLElement) => {
    el.style.transition = "";
    el.style.overflow = "";
    el.style.opacity = "";
    el.style.maxHeight = "";
    el.style.transform = "";
    el.style.willChange = "";
  };

  const renderContent = () => {
    const f = p.f;
    const handle = p.handle;

    switch (f.kind) {
      case FieldKind.dateRange:
        return <DateRangePickerWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.date:
        return <DatePickerWrapper spec={f} field={handle} fullWidth={p.fullWidth} />;

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
  };

  return (
    <Transition
      onEnter={(rawEl, done) => {
        const el = rawEl as HTMLElement;
        const targetHeight = Math.max(1, Math.ceil(el.getBoundingClientRect().height));

        el.style.overflow = "hidden";
        el.style.maxHeight = "0px";
        el.style.opacity = "0";
        el.style.transform = "translateY(-4px) scale(0.985)";
        el.style.willChange = "max-height, opacity, transform";

        el.getBoundingClientRect();

        el.style.transition = [
          `max-height ${ENTER_MS}ms ${ENTER_EASING}`,
          `opacity ${ENTER_MS}ms ${ENTER_EASING}`,
          `transform ${ENTER_MS}ms ${ENTER_EASING}`,
        ].join(", ");

        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.maxHeight = `${targetHeight}px`;
          el.style.transform = "translateY(0) scale(1)";
        });

        const timer = window.setTimeout(() => {
          clearSlotInlineStyles(el);
          done();
        }, ENTER_MS + 40);

        el.addEventListener(
          "transitionend",
          (e) => {
            if (e.target !== el) return;
            window.clearTimeout(timer);
            clearSlotInlineStyles(el);
            done();
          },
          { once: true },
        );
      }}
      onExit={(rawEl, done) => {
        const el = rawEl as HTMLElement;
        const rect = el.getBoundingClientRect();
        const height = Math.max(1, Math.ceil(rect.height));

        el.style.overflow = "hidden";
        el.style.maxHeight = `${height}px`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0) scale(1)";
        el.style.willChange = "max-height, opacity, transform";

        el.getBoundingClientRect();

        el.style.transition = [
          `max-height ${EXIT_MS}ms ${EXIT_EASING}`,
          `opacity ${EXIT_MS}ms ${EXIT_EASING}`,
          `transform ${EXIT_MS}ms ${EXIT_EASING}`,
        ].join(", ");

        requestAnimationFrame(() => {
          el.style.opacity = "0";
          el.style.maxHeight = "0px";
          el.style.transform = "translateY(-4px) scale(0.985)";
        });

        const timer = window.setTimeout(() => {
          clearSlotInlineStyles(el);
          done();
        }, EXIT_MS + 40);

        el.addEventListener(
          "transitionend",
          (e) => {
            if (e.target !== el) return;
            window.clearTimeout(timer);
            clearSlotInlineStyles(el);
            done();
          },
          { once: true },
        );
      }}
    >
      {!hidden() ? (
        p.wrapInRow ? (
          <div
            class="tf-slot"
            data-field-slot-id={p.f.id}
            style={{ width: "100%", "min-width": "0" }}
          >
            {renderContent()}
          </div>
        ) : (
          <div class="tf-slot" data-field-slot-id={p.f.id}>
            {renderContent()}
          </div>
        )
      ) : null}
    </Transition>
  );
};
