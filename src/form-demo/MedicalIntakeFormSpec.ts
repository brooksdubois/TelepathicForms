import {
  FieldKind,
  OperatorMaths,
  type FieldSpec,
  TriggerOperators,
  type FormSpec,
  WhenOperators,
} from "../engine/types";

export type DemoSection = {
  id: string;
  title: string;
  fields: FieldSpec[];
};

const dosageUnits = [
  {label: "Milligram (mg)", value: "mg"},
  {label: "Gram (g)", value: "g"},
  {label: "Microgram (mcg)", value: "mcg"},
  {label: "Milliliter (mL)", value: "ml"},
  {label: "Liter (L)", value: "l"},
  {label: "Ounce (oz)", value: "oz"},
  {label: "International Unit (IU)", value: "iu"},
];

const timeOfDayOptions = [
  {label: "Morning", value: "morning"},
  {label: "Midday", value: "midday"},
  {label: "Evening", value: "evening"},
  {label: "Bedtime", value: "bedtime"},
  {label: "As Needed", value: "asNeeded"},
];

const normalizePhoneDigits = (value: string) => (value ?? "").replace(/\D/g, "");
const normalizeEmail = (value: string) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

const applyInitialValues = (
  fields: FieldSpec[],
  initialValues?: Record<string, string>,
): FieldSpec[] => {
  if (!initialValues) return fields;

  return fields.map((field) => {
    if (!Object.prototype.hasOwnProperty.call(initialValues, field.id)) return field;
    return {...field, initialValue: initialValues[field.id]};
  });
};

const buildPrescriptionFields = (index: number): FieldSpec[] => {
  const rowBase = 1 + index * 2;
  const labelSuffix = ` #${index + 1}`;

  return [
    {
      id: `rx_${index}_medicine`,
      kind: FieldKind.text,
      label: `Medicine Name${labelSuffix}`,
      row: rowBase,
      placeholder: "e.g., Lisinopril",
      helperText: "Prescription medicine name",
      required: true,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `rx_${index}_dosage`,
      kind: FieldKind.number,
      label: `Dosage${labelSuffix}`,
      row: rowBase,
      placeholder: "100",
      helperText: "Numeric amount",
      maxDigits: 6,
      required: true,
      size: "sm",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `rx_${index}_unit`,
      kind: FieldKind.select,
      label: "Dosage Measurement",
      row: rowBase,
      placeholder: "Select unit",
      helperText: "mg, oz, mL, etc.",
      options: dosageUnits,
      required: true,
      size: "sm",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `rx_${index}_timeOfDay`,
      kind: FieldKind.select,
      label: "Time of Day Taken",
      row: rowBase,
      placeholder: "Select time",
      helperText: "Daily timing preference",
      options: timeOfDayOptions,
      required: true,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
  ];
};

export const buildMedicalIntakeSections = (
  prescriptionRows = 1,
  initialValues?: Record<string, string>,
): DemoSection[] => {
  const count = Math.max(1, Math.floor(prescriptionRows));
  const safeCount = Math.min(count, 12);

  const patientIdentity: DemoSection = {
    id: "patient-identity",
    title: "Patient Identity",
    fields: applyInitialValues(
      [
        {
          id: "firstName",
          kind: FieldKind.text,
          label: "First Name",
          row: 1,
          placeholder: "Jane",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "lastName",
          kind: FieldKind.text,
          label: "Last Name",
          row: 1,
          placeholder: "Doe",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "dateOfBirth",
          kind: FieldKind.date,
          label: "Date of Birth",
          row: 2,
          placeholder: "YYYY-MM-DD",
          required: true,
          size: "md",
          variant: "outlined",
          clearable: false,
          closeOnSelect: true,
          disableFuture: true,
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "gender",
          kind: FieldKind.select,
          label: "Gender",
          row: 2,
          placeholder: "Select one",
          options: [
            {label: "Female", value: "female"},
            {label: "Male", value: "male"},
            {label: "Non-binary", value: "nonbinary"},
            {label: "Prefer not to say", value: "unspecified"},
          ],
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "phone",
          kind: FieldKind.phone,
          label: "Patient Phone",
          row: 3,
          placeholder: "(___) ___-____",
          inputMask: "(___) ___-____",
          inputBlocker: "^\\d{0,10}$",
          required: true,
          size: "md",
          variant: "outlined",
          startAdornment: "US",
          ringEnabled: true,
          animateRingOnFocus: true,
          triggers: [
            {
              when: {operator: WhenOperators.isValid},
              operation: {
                fieldIds: ["confirmPatientPhone"],
                operator: TriggerOperators.setDisabled,
                value: false,
              },
            },
            {
              when: {operator: WhenOperators.isInvalid},
              operations: [
                {
                  fieldIds: ["confirmPatientPhone"],
                  operator: TriggerOperators.setDisabled,
                  value: true,
                },
                {
                  fieldIds: ["confirmPatientPhone"],
                  operator: TriggerOperators.setValue,
                  value: "",
                },
              ],
            },
          ],
        },
        {
          id: "confirmPatientPhone",
          kind: FieldKind.phone,
          label: "Confirm Patient Phone",
          row: 3,
          placeholder: "(___) ___-____",
          inputMask: "(___) ___-____",
          inputBlocker: "^\\d{0,10}$",
          required: false,
          size: "md",
          variant: "outlined",
          startAdornment: "US",
          ringEnabled: true,
          animateRingOnFocus: true,
          validationDependencies: ["phone"],
          validate: (value, context) => {
            const confirmValue = normalizePhoneDigits(value);
            const sourceValue = context?.getValue?.("phone") ?? "";

            if (!confirmValue) return [];
            if (!sourceValue) return [];

            return confirmValue === sourceValue
              ? []
              : ["Phone numbers do not match."];
          },
          helperText: "Re-enter patient phone number.",
        },
        {
          id: "email",
          kind: FieldKind.text,
          label: "Email Address",
          row: 3,
          type: "email",
          placeholder: "you@example.com",
          autoComplete: "email",
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          validate: (value) => {
            if (!value) return [];
            if (!/^[^@]+@[^@]+\.[^@]+$/.test(value)) return ["Enter a valid email."];
            return [];
          },
          triggers: [
            {
              when: {
                [OperatorMaths.all]: [
                  {fieldIds: ["email"], operator: WhenOperators.isValid},
                  {fieldIds: ["email"], operator: WhenOperators.notEquals, value: ""},
                ],
              },
              operation: {
                fieldIds: ["confirmEmail"],
                operator: TriggerOperators.setDisabled,
                value: false,
              },
            },
            {
              when: {fieldIds: ["email"], operator: WhenOperators.isEmpty},
              operations: [
                {
                  fieldIds: ["confirmEmail"],
                  operator: TriggerOperators.setDisabled,
                  value: true,
                },
                {
                  fieldIds: ["confirmEmail"],
                  operator: TriggerOperators.setValue,
                  value: "",
                },
              ],
            },
            {
              when: {fieldIds: ["email"], operator: WhenOperators.isInvalid},
              operations: [
                {
                  fieldIds: ["confirmEmail"],
                  operator: TriggerOperators.setDisabled,
                  value: true,
                },
                {
                  fieldIds: ["confirmEmail"],
                  operator: TriggerOperators.setValue,
                  value: "",
                },
              ],
            },
          ],
        },
        {
          id: "confirmEmail",
          kind: FieldKind.text,
          label: "Confirm Email",
          row: 3,
          placeholder: "you@example.com",
          autoComplete: "email",
          type: "email",
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          validationDependencies: ["email"],
          helperText: "Re-enter email address.",
          validate: (value, context) => {
            const confirmValue = normalizeEmail(value);
            const sourceValue = normalizeEmail(context?.getValue?.("email") ?? "");
            if (!confirmValue) return [];
            if (!sourceValue) return [];

            if (!/^\S+@\S+\.\S+$/.test(confirmValue)) {
              return ["Enter a valid email."];
            }

            return confirmValue === sourceValue
              ? []
              : ["Email addresses do not match."];
          },
        },
      ],
      initialValues,
    ),
  };

  const administrative: DemoSection = {
    id: "administrative-details",
    title: "Administrative Details",
    fields: applyInitialValues(
      [
        {
          id: "ssn",
          kind: FieldKind.ssn,
          label: "Social Security Number",
          row: 1,
          placeholder: "___-__-____",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          helperText: "Stored as raw digits.",
        },
        {
          id: "hasInsurance",
          kind: FieldKind.switch,
          row: 1,
          label: "I have insurance",
          helperText: "Enable to show provider and policy fields.",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          triggers: [
            {
              when: {
                operator: WhenOperators.equals,
                value: "true",
              },
              operations: [
                {fieldIds: ["insuranceProvider", "insurancePolicyId"], operator: TriggerOperators.setHidden, value: false},
                {fieldIds: ["insuranceProvider", "insurancePolicyId"], operator: TriggerOperators.setDisabled, value: false},
              ],
            },
            {
              when: {
                operator: WhenOperators.notEquals,
                value: "true",
              },
              operations: [
                {fieldIds: ["insuranceProvider", "insurancePolicyId"], operator: TriggerOperators.setHidden, value: true},
                {fieldIds: ["insuranceProvider", "insurancePolicyId"], operator: TriggerOperators.setDisabled, value: true},
                {fieldIds: ["insuranceProvider", "insurancePolicyId"], operator: TriggerOperators.setValue, value: ""},
              ],
            },
          ],
        },
        {
          id: "insuranceProvider",
          kind: FieldKind.text,
          label: "Insurance Provider",
          row: 2,
          placeholder: "UnitedHealth, Aetna, Blue Cross",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "insurancePolicyId",
          kind: FieldKind.text,
          label: "Policy ID",
          row: 2,
          placeholder: "Policy number",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
      ],
      initialValues,
    ),
  };

  const visitSection: DemoSection = {
    id: "visit-context",
    title: "Visit Context",
    fields: applyInitialValues(
      [
        {
          id: "visitDate",
          kind: FieldKind.date,
          label: "Preferred Appointment Date",
          row: 1,
          placeholder: "YYYY-MM-DD",
          clearable: true,
          disablePast: true,
          closeOnSelect: true,
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "reasonForVisit",
          kind: FieldKind.select,
          label: "Reason for Visit",
          row: 1,
          placeholder: "Choose one",
          options: [
            {label: "Routine Checkup", value: "routine"},
            {label: "Follow-up", value: "followup"},
            {label: "Acute Illness", value: "illness"},
            {label: "Allergy/Immunology", value: "allergy"},
            {label: "Chronic Care", value: "chronic"},
          ],
          size: "md",
          variant: "outlined",
          required: true,
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "chiefComplaint",
          kind: FieldKind.textArea,
          label: "Chief Complaint",
          row: 2,
          placeholder: "Describe what brings you in today",
          helperText: "Keep this short initially",
          rows: 4,
          autosize: false,
          showCharacterCount: true,
          maxLength: 3000,
          required: true,
          minRows: 3,
          maxRows: 5,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
      ],
      initialValues,
    ),
  };

  const historySection: DemoSection = {
    id: "medical-history",
    title: "Medical History",
    fields: applyInitialValues(
      [
        {
          id: "medicalHistory",
          kind: FieldKind.textArea,
          label: "Past Medical History",
          row: 1,
          placeholder: "List major diagnoses, surgeries, and prior conditions.",
          helperText: "Long-form text area",
          rows: 6,
          autosize: true,
          minRows: 4,
          maxRows: 10,
          showCharacterCount: true,
          maxLength: 4000,
          required: false,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "allergies",
          kind: FieldKind.textArea,
          label: "Known Allergies",
          row: 2,
          placeholder: "Include medication and environmental allergies.",
          helperText: "List each allergy with severity if known.",
          rows: 4,
          autosize: true,
          minRows: 2,
          maxRows: 7,
          required: false,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
      ],
      initialValues,
    ),
  };

  const prescriptionSection: DemoSection = {
    id: "prescriptions",
    title: "Prescription Medicines",
    fields: applyInitialValues(
      Array.from({length: safeCount}, (_, index) => buildPrescriptionFields(index)).flat(),
      initialValues,
    ),
  };

  return [patientIdentity, administrative, visitSection, historySection, prescriptionSection];
};

export const buildMedicalIntakeFormSpec = (
  prescriptionRows = 1,
  initialValues?: Record<string, string>,
): FormSpec => {
  const sections = buildMedicalIntakeSections(prescriptionRows, initialValues);

  return {
    id: "medical-intake",
    fields: sections.flatMap((section) => section.fields),
  };
};
