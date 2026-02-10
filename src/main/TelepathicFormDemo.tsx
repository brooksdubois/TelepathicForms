import {onCleanup, type Component} from "solid-js";
import {
  buildGraphFromFormSpec,
  FieldKind,
  FormRenderer,
  OperatorMaths,
  TriggerOperators,
  WhenOperators,
  type FormSpec,
} from "../engine/generators";
import {fromObservable} from "../utils/fromObservable";

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
        size: "lg",
        variant: "outlined",
        startAdornment: "Method",
        ringEnabled: true,
        animateRingOnFocus: true,
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
        size: "md",
        variant: "outlined",
        startAdornment: "US",
        endAdornment: "10 digits",
        ringEnabled: true,
        animateRingOnFocus: true,
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
        placeholder: "000000",
        maxDigits: 6,
        size: "sm",
        variant: "standard",
        ringEnabled: true,
        animateRingOnFocus: true,
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
        row: 4,
        label: "Email",
        placeholder: "you@example.com",
        helperText: "Used when contact method is email.",
        type: "email",
        autoComplete: "email",
        minLength: 6,
        maxLength: 120,
        size: "lg",
        variant: "filled",
        startAdornment: "@",
        endAdornment: "required for email",
        ringEnabled: true,
        animateRingOnFocus: true,
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
        variant: "filled",
        size: "md",
        inline: true,
        ringEnabled: true,
        options: [
          {label: "Morning", value: "morning", helperText: "8am-12pm"},
          {label: "Afternoon", value: "afternoon", helperText: "12pm-5pm"},
          {label: "Evening", value: "evening", helperText: "5pm-8pm"},
        ],
        helperText: "Used for phone follow-ups.",
      },
      {
        id: "zip",
        kind: FieldKind.zip,
        label: "ZIP Code",
        inputMask: "00000[-0000]",
        inputBlocker: "^\\d{0,9}$",
        size: "md",
        variant: "outlined",
        startAdornment: "US",
        ringEnabled: true,
        animateRingOnFocus: true,
        required: true,
        helperText: "Required only for mail contact.",
      },
      {
        id: "isEmployee",
        kind: FieldKind.checkbox,
        row: 1,
        label: "I am an employee",
        helperText: "Employee-only SSN field will unlock.",
        variant: "outlined",
        size: "md",
        ringEnabled: true,
        animateRingOnFocus: true,
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
        id: "alertsEnabled",
        kind: FieldKind.switch,
        row: 5,
        label: "Enable Product Alerts",
        helperText: "Demonstrates the Switch primitive wrapper.",
        variant: "filled",
        size: "md",
        ringEnabled: true,
        animateRingOnFocus: true,
      },
      {
        id: "interests",
        kind: FieldKind.multiSelect,
        row: 5,
        label: "Interest Areas",
        placeholder: "Pick one or more",
        helperText: "Demonstrates grouped options, search, clear, and maxSelected.",
        searchable: true,
        clearable: true,
        maxSelected: 3,
        variant: "outlined",
        size: "md",
        options: [
          {label: "Billing", value: "billing", group: "Support"},
          {label: "Technical", value: "technical", group: "Support"},
          {label: "Roadmap", value: "roadmap", group: "Product"},
          {label: "Integrations", value: "integrations", group: "Product"},
          {label: "Security", value: "security", group: "Platform"},
        ],
      },
      {
        id: "ssn",
        kind: FieldKind.ssn,
        label: "SSN (optional)",
        inputMask: "___-__-____",
        inputBlocker: "^\\d{0,9}$",
        size: "md",
        variant: "filled",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "Digits only. Stored as raw digits.",
      },
      {
        id: "salary",
        kind: FieldKind.currency,
        row: 3,
        label: "Desired Salary",
        placeholder: "0.00",
        size: "lg",
        variant: "filled",
        startAdornment: "$",
        endAdornment: "USD",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "Six figures max",
      },
      {
        id: "taxPercent",
        kind: FieldKind.percent,
        row: 3,
        label: "Estimated taxation",
        placeholder: "0.00",
        size: "lg",
        variant: "outlined",
        endAdornment: "%",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "How much you will expect to be taxed",
      },
      {
        id: "notes",
        kind: FieldKind.textArea,
        row: 4,
        label: "Notes",
        placeholder: "Anything else we should know?",
        helperText: "Up to 240 chars.",
        size: "md",
        variant: "outlined",
        rows: 4,
        autosize: true,
        minRows: 3,
        maxRows: 7,
        ringEnabled: true,
        animateRingOnFocus: true,
        validate: (v) => (v.length > 240 ? ["Max 240 chars."] : []),
      },
      {
        id: "password",
        kind: FieldKind.password,
        label: "Account Password",
        placeholder: "••••••••",
        autoComplete: "new-password",
        minLength: 8,
        maxLength: 128,
        size: "md",
        variant: "filled",
        ringEnabled: true,
        animateRingOnFocus: true,
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
