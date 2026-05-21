import {FieldKind, FormSpec, OperatorMaths, TriggerOperators, WhenOperators} from "../engine/types";

export const demoFormSpec: FormSpec = {
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
            {fieldIds: ["phone", "hasExtension", "ext", "email", "zip", "preferredTime", "followUpDate", "notes", "password", "travelDates"], operator: TriggerOperators.setHidden, value: true},
          ],
        },

        // PHONE: show phone-related fields; hide email/mail fields; show common fields
        {
          when: {operator: WhenOperators.equals, value: "phone"},
          operations: [
            {fieldIds: ["phone", "hasExtension", "preferredTime", "followUpDate", "notes", "password", "travelDates"], operator: TriggerOperators.setHidden, value: false},
            {fieldIds: ["email", "zip", "ext"], operator: TriggerOperators.setHidden, value: true},
            {fieldIds: ["email", "zip", "ext"], operator: TriggerOperators.setValue, value: ""},
          ],
        },

        // EMAIL: show email; hide phone/mail fields; show common fields
        {
          when: {operator: WhenOperators.equals, value: "email"},
          operations: [
            {fieldIds: ["email", "followUpDate", "notes", "password", "travelDates"], operator: TriggerOperators.setHidden, value: false},
            {fieldIds: ["phone", "hasExtension", "ext", "zip", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
            {fieldIds: ["phone", "hasExtension", "ext", "zip", "preferredTime"], operator: TriggerOperators.setValue, value: ""},
          ],
        },

        // MAIL: show zip; hide phone/email fields; show common fields
        {
          when: {operator: WhenOperators.equals, value: "mail"},
          operations: [
            {fieldIds: ["zip", "followUpDate", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
            {fieldIds: ["phone", "hasExtension", "ext", "email", "preferredTime", "travelDates"], operator: TriggerOperators.setHidden, value: true},
            {fieldIds: ["phone", "hasExtension", "ext", "email", "preferredTime", "travelDates"], operator: TriggerOperators.setValue, value: ""},
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
      kind: FieldKind.checkbox,
      row: 2,
      label: "Has extension?",
      helperText: "Check to enable extension input fields",
    },
    {
      id: "ext",
      kind: FieldKind.number,
      row: 2,
      label: "Extension",
      helperText: "Enter a Phone Number first",
      placeholder: "Digits only, max 6",
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
      startAdornment: "📧",
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
    // New DateRange field
    {
      id: "availabilityRange",
      kind: FieldKind.dateRange,
      row: 4,
      label: "Availability Dates",
      placeholder: "Select Availability",
      helperText: "Choose your start and end dates",
      required: false,
      clearable: true,
      disablePast: true,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
      validate: (v) => {
        try {
          const parsed = JSON.parse(v);
          const startDate = new Date(parsed.start);
          const endDate = new Date(parsed.end);

          // Ensure valid dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return ["Invalid date format"];
          }

          // Ensure start date is before end date
          if (startDate > endDate) {
            return ["Start date must be before end date"];
          }

          // Ensure trip is not longer than 30 days
          const daysDifference = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
          if (daysDifference > 30) {
            return ["Trip cannot be longer than 30 days"];
          }
          return [];
        } catch {
          return ["Invalid date range"];
        }
      },
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