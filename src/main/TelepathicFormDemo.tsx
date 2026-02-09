import {For, Show, onCleanup, type Component} from "solid-js";
import {
  buildGraphFromFormSpec,
  FieldKind,
  OperatorMaths,
  TriggerOperators,
  WhenOperators,
  type FieldHandle,
  type FieldSpec,
  type FormSpec,
} from "../engine/generators";
import {
  BoundTextField,
  CheckboxField,
  CurrencyField,
  InlineCheckboxField,
  InlineRadioField,
  NumberField,
  PasswordField,
  PercentField,
  PhoneField,
  RadioField,
  SelectField,
  SsnField,
  TextAreaField,
  ZipField,
} from "../wrappers";
import {fromObservable} from "../utils/fromObservable";

type RowGroup = {
  key: string;
  fields: FieldSpec[];
  sharedRow: boolean;
};

function groupFieldsByRow(fields: FieldSpec[]): RowGroup[] {
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

type FieldSlotProps = {
  f: FieldSpec;
  handle: FieldHandle;
  fullWidth?: boolean;
  wrapInRow?: boolean;
};

const FieldSlot: Component<FieldSlotProps> = (p) => {
  const hidden = fromObservable(p.handle.hidden$, false);
  const content = (() => {
    const f = p.f;
    const handle = p.handle;

    switch (f.kind) {
      case FieldKind.textArea:
        return <TextAreaField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.phone:
        return (
          <PhoneField
            id={f.id}
            label={f.label}
            placeholder={f.placeholder}
            helperText={f.helperText}
            inputMask={f.inputMask}
            inputBlocker={f.inputBlocker}
            required={f.required}
            fullWidth={p.fullWidth}
            field={handle}
          />
        );

      case FieldKind.number:
        return (
          <NumberField
            id={f.id}
            label={f.label}
            placeholder={f.placeholder}
            helperText={f.helperText}
            maxDigits={f.maxDigits}
            required={f.required}
            fullWidth={p.fullWidth}
            field={handle}
          />
        );

      case FieldKind.currency:
        return <CurrencyField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.percent:
        return <PercentField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.select:
        return <SelectField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.checkbox:
        return <CheckboxField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.inlineCheckbox:
        return <InlineCheckboxField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.radio:
        return <RadioField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.inlineRadio:
        return <InlineRadioField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.ssn:
        return <SsnField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.zip:
        return <ZipField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.password:
        return <PasswordField spec={f} field={handle} fullWidth={p.fullWidth} />;

      case FieldKind.text:
      default:
        return <BoundTextField spec={f} field={handle} fullWidth={p.fullWidth} />;
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

/** ---------------------------------------------
 * 6) Spec-driven renderer (UI layer)
 * --------------------------------------------- */

type FormRendererProps = {
  form: FormSpec;
  handlesById: Map<string, FieldHandle>;
};

const FormRenderer: Component<FormRendererProps> = (p) => {
  const groupedRows = groupFieldsByRow(p.form.fields);

  return (
    <div>
      <For each={groupedRows}>
        {(row) =>
          row.sharedRow ? (
            <div
              style={{
                display: "flex",
                "align-items": "flex-start",
                "flex-wrap": "wrap",
                gap: "12px",
                width: "100%",
              }}
            >
              <For each={row.fields}>
                {(f) => {
                  const handle = p.handlesById.get(f.id);
                  if (!handle) throw new Error(`Missing FieldHandle for ${f.id}`);
                  return <FieldSlot f={f} handle={handle} fullWidth={true} wrapInRow={true} />;
                }}
              </For>
            </div>
          ) : (
            (() => {
              const f = row.fields[0];
              const handle = p.handlesById.get(f.id);
              if (!handle) throw new Error(`Missing FieldHandle for ${f.id}`);
              return <FieldSlot f={f} handle={handle} />;
            })()
          )
        }
      </For>
    </div>
  );
};

/** ---------------------------------------------
 * Demo App: Spec-driven version
 * --------------------------------------------- */
export const TelepathicFormDemo: Component = () => {
  // This is the JS object that “draws” the form.
  // In the real system, Kotlin would output/compile something like this.
  const formSpec: FormSpec = {
    id: "demo",
    fields: [
      {
        id: "contactMethod",
        kind: FieldKind.select,
        row: 1,
        label: "Preferred Contact Method",
        placeholder: "Select one...",
        required: true,
        options: [
          {label: "Phone", value: "phone"},
          {label: "Email", value: "email"},
          {label: "Mail", value: "mail"},
        ],
        triggers: [
          // INITIAL: nothing selected -> hide everything except the selectors
          {
            when: WhenOperators.isEmpty,
            operations: [
              {fieldIds: ["phone", "hasExtension", "ext", "email", "zip", "preferredTime", "notes", "password"], operator: TriggerOperators.setHidden, value: true},
              // keep these disabled/cleared as a safety baseline
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },

          // PHONE: show phone-related fields; hide email/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "phone"},
            operations: [
              {fieldIds: ["phone", "hasExtension", "preferredTime", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["email", "zip"], operator: TriggerOperators.setHidden, value: true},
              // ext is controlled by its own triggers; default hidden until its triggers show it
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: false},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // EMAIL: show email; hide phone/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "email"},
            operations: [
              {fieldIds: ["email", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "zip", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // MAIL: show zip; hide phone/email fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "mail"},
            operations: [
              {fieldIds: ["zip", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "email", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // NOT PHONE: disable + clear phone and extension controls
          {
            when: {operator: WhenOperators.notEquals, value: "phone"},
            operations: [
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // NOT MAIL: disable + clear zip
          {
            when: {operator: WhenOperators.notEquals, value: "mail"},
            operations: [
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "phone",
        kind: FieldKind.phone,
        row: 2,
        label: "Phone (required for phone contact)",
        placeholder: "(___) ___-____",
        inputMask: "(___) ___-____",
        inputBlocker: "^\\d{0,10}$",
        required: true,
        helperText: "Digits are stored; formatting is view-only.",
      },
      {
        id: "hasExtension",
        kind: FieldKind.inlineCheckbox,
        row: 2,
        label: "Has extension",
        helperText: "Enable the extension field.",
      },
      {
        id: "ext",
        kind: FieldKind.number,
        row: 2,
        label: "Extension",
        helperText: "Optional. Digits only, max 6.",
        maxDigits: 6,
        validate: (v) => {
          if (!v) return []; // optional
          if (!/^\d{1,6}$/.test(v)) return ["Ext must be 1–6 digits."];
          return [];
        },
        triggers: [
          // Show/hide purely based on the checkbox
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setHidden,
              value: false,
            },
          },
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setHidden,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },

          // Enable only when phone is valid AND the checkbox is on
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isValid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setDisabled,
              value: false,
            },
          },

          // If phone becomes invalid while shown, disable + clear (but keep visibility)
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isInvalid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },
        ],
      },
      {
        id: "email",
        kind: FieldKind.text,
        label: "Email",
        placeholder: "you@example.com",
        helperText: "Used when contact method is email.",
        validate: (v) => {
          if (!v) return [];
          if (!/^[^@]+@[^@]+\.[^@]+$/.test(v)) return ["Enter a valid email."];
          return [];
        },
      },
      {
        id: "preferredTime",
        kind: FieldKind.inlineRadio,
        row: 1,
        label: "Preferred Time",
        required: true,
        options: [
          {label: "Morning", value: "morning"},
          {label: "Afternoon", value: "afternoon"},
          {label: "Evening", value: "evening"},
        ],
        helperText: "Used for phone follow-ups.",
      },
      {
        id: "zip",
        kind: FieldKind.zip,
        label: "ZIP Code",
        inputMask: "00000[-0000]",
        inputBlocker: "^\\d{0,9}$",
        required: true,
        helperText: "Required only for mail contact.",
      },
      {
        id: "isEmployee",
        kind: FieldKind.checkbox,
        row: 1,
        label: "I am an employee",
        helperText: "Employee-only SSN field will unlock.",
        triggers: [
          {
            when: {operator: WhenOperators.equals, value: "true"},
            operations: [
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },
          {
            when: {operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "ssn",
        kind: FieldKind.ssn,
        label: "SSN (optional)",
        inputMask: "___-__-____",
        inputBlocker: "^\\d{0,9}$",
        helperText: "Digits only. Stored as raw digits.",
      },
      {
        id: "salary",
        kind: FieldKind.currency,
        row: 3,
        label: "Desired Salary",
       // inputMask: "$______.__",
       // inputBlocker: "^\\d{0,6}\.\\d{0,2}$",
        helperText: "Six figures max",
      },
      {
        id: "taxPercent",
        kind: FieldKind.percent,
        row: 3,
        label: "Estimated taxation",
        //inputMask: "%__.____",
        //inputBlocker: "^\\d{0,2}\.\\d{0,4}$",
        helperText: "How much you will expect to be taxed",
      },
      {
        id: "notes",
        kind: FieldKind.textArea,
        label: "Notes",
        placeholder: "Anything else we should know?",
        helperText: "Up to 240 chars.",
        validate: (v) => (v.length > 240 ? ["Max 240 chars."] : []),
      },
      {
        id: "password",
        kind: FieldKind.password,
        label: "Account Password",
        placeholder: "••••••••",
        helperText: "Toggle show/hide (no masking rules enforced).",
      },
    ],
  };

  const {graph, nodesById, handlesById} = buildGraphFromFormSpec(formSpec);
  onCleanup(() => graph.destroy());

  const zipSpec = formSpec.fields.find((f) => f.id === "zip")!;
  const passwordSpec = formSpec.fields.find((f) => f.id === "password")!;

  // debug readouts
  const contactMethod = fromObservable(nodesById.get("contactMethod")!.value$, "");
  const phoneValid = fromObservable(nodesById.get("phone")!.valid$, false);
  const extDisabled = fromObservable(nodesById.get("ext")!.disabled$, false);
  const zipDisabled = fromObservable(nodesById.get("zip")!.disabled$, false);

  return (
    <div style={{padding: "18px"}}>
      <div style={{"font-family": "system-ui", "font-size": "16px", "margin-bottom": "10px"}}>
        Telepathic Fields (spec-driven sketch)
      </div>

      <FormRenderer form={formSpec} handlesById={handlesById}/>
      {/*<div style={{"margin-top": "18px", "font-family": "system-ui", "font-size": "12px", opacity: 0.7}}>*/}
      {/*  InlineRow demo (duplicates below)*/}
      {/*</div>*/}
      {/*<InlineRow>*/}
      {/*  <ZipField spec={zipSpec} field={handlesById.get("zip")!} inline={true} />*/}
      {/*  <PasswordField spec={passwordSpec} field={handlesById.get("password")!} inline={true} />*/}
      {/*</InlineRow>*/}

      <div
        style={{
          "margin-top": "14px",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": "12px",
        }}
      >
        <div>phone.valid = {String(phoneValid())}</div>
        <div>ext.disabled (wired) = {String(extDisabled())}</div>
        <div>zip.disabled (wired) = {String(zipDisabled())}</div>
        <div>contactMethod = {contactMethod() || "(empty)"}</div>
      </div>
    </div>
  );
};
