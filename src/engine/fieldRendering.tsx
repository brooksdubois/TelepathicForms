import { type Component } from "solid-js";
import { Transition } from "solid-transition-group";
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
  const renderContent = () => {
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
  };

  return (
    <Transition
      onEnter={(rawEl, done) => {
        const el = rawEl as HTMLElement;
        // Ensure the base class is present (the child div uses tf-slot)
        // Animate via max-height / max-width + opacity (no transforms) to avoid stacking-context issues.
        const DURATION_MS = 160;

        // Start collapsed
        el.style.overflow = "hidden";
        el.style.opacity = "0";
        el.style.maxHeight = "0px";
        el.style.maxWidth = "0px";

        // Force initial layout
        el.getBoundingClientRect();

        // Measure natural size
        el.style.maxHeight = "none";
        el.style.maxWidth = "none";
        const targetH = el.scrollHeight;
        const targetW = el.getBoundingClientRect().width; // respect layout (flex/row) rather than scrollWidth

        // Reset to collapsed before animating
        el.style.maxHeight = "0px";
        el.style.maxWidth = "0px";
        el.getBoundingClientRect();

        // Animate to target
        el.style.transition = `max-height ${DURATION_MS}ms ease-out, max-width ${DURATION_MS}ms ease-out, opacity ${DURATION_MS}ms ease-out`;
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.maxHeight = `${targetH}px`;
          el.style.maxWidth = `${Math.max(0, Math.ceil(targetW))}px`;
        });

        const cleanup = () => {
          el.style.transition = "";
          el.style.overflow = "";
          el.style.opacity = "";
          el.style.maxHeight = "";
          el.style.maxWidth = "";
        };

        // Transitionend can fire multiple times (one per property). Use a timer as the single source of truth.
        const timer = window.setTimeout(() => {
          cleanup();
          done();
        }, DURATION_MS + 40);

        el.addEventListener(
          "transitionend",
          (e) => {
            if (e.target !== el) return;
            window.clearTimeout(timer);
            cleanup();
            done();
          },
          { once: true },
        );
      }}
      onExit={(rawEl, done) => {
        const el = rawEl as HTMLElement;
        const DURATION_MS = 140;

        // Lock current size so we can animate collapse
        const rect = el.getBoundingClientRect();
        el.style.overflow = "hidden";
        el.style.opacity = "1";
        el.style.maxHeight = `${Math.ceil(rect.height)}px`;
        el.style.maxWidth = `${Math.ceil(rect.width)}px`;

        el.getBoundingClientRect();

        el.style.transition = `max-height ${DURATION_MS}ms ease-in, max-width ${DURATION_MS}ms ease-in, opacity ${DURATION_MS}ms ease-in`;
        requestAnimationFrame(() => {
          el.style.opacity = "0";
          el.style.maxHeight = "0px";
          el.style.maxWidth = "0px";
        });

        const timer = window.setTimeout(() => {
          done();
        }, DURATION_MS + 40);

        el.addEventListener(
          "transitionend",
          (e) => {
            if (e.target !== el) return;
            window.clearTimeout(timer);
            done();
          },
          { once: true },
        );
      }}
    >
      {!hidden() ? (
        p.wrapInRow ? (
          <div class="tf-slot" style={{ flex: "1 1 0", "min-width": "240px" }}>
            {renderContent()}
          </div>
        ) : (
          <div class="tf-slot">{renderContent()}</div>
        )
      ) : null}
    </Transition>
  );
};
