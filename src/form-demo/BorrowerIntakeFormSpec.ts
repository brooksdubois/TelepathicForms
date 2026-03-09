import {
  FieldKind,
  type FieldSpec,
  type FormSpec,
  TriggerOperators,
  WhenOperators,
} from "../engine/types";
import type {DemoSection} from "./MedicalIntakeFormSpec";

const usStates = [
  "Alabama",
  "Alaska",
  "Arizona",
  "California",
  "Colorado",
  "Connecticut",
  "Florida",
  "Georgia",
  "Illinois",
  "Indiana",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "New York",
  "North Carolina",
  "Ohio",
  "Texas",
  "Virginia",
  "Washington",
].map((state) => ({label: state, value: state.toLowerCase()}));

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

const buildPreviousAddressFields = (index: number): FieldSpec[] => {
  const rowBase = 1 + index * 2;
  const suffix = ` #${index + 1}`;

  return [
    {
      id: `previousAddress_${index}_street`,
      kind: FieldKind.text,
      label: `Previous Address Line 1${suffix}`,
      row: rowBase,
      placeholder: "123 Main Street",
      required: false,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
      helperText: "Previous residence street address",
    },
    {
      id: `previousAddress_${index}_line2`,
      kind: FieldKind.text,
      label: `Previous Address Line 2${suffix}`,
      row: rowBase,
      placeholder: "Apt, unit, suite",
      required: false,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `previousAddress_${index}_city`,
      kind: FieldKind.text,
      label: `Previous City${suffix}`,
      row: rowBase,
      placeholder: "City",
      required: false,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `previousAddress_${index}_state`,
      kind: FieldKind.select,
      label: `Previous State${suffix}`,
      row: rowBase,
      placeholder: "Select state",
      options: usStates,
      required: false,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
    {
      id: `previousAddress_${index}_zip`,
      kind: FieldKind.zip,
      label: `Previous ZIP${suffix}`,
      row: rowBase + 1,
      placeholder: "00000",
      inputMask: "00000[-0000]",
      inputBlocker: "^\\d{0,9}$",
      required: false,
      size: "md",
      variant: "outlined",
      ringEnabled: true,
      animateRingOnFocus: true,
    },
  ];
};

const buildTaxAddressFields = (): FieldSpec[] => [
  {
    id: "taxAddressLine1",
    kind: FieldKind.text,
    label: "Tax Address Line 1",
    row: 5,
    placeholder: "456 Finance Avenue",
    required: true,
    size: "md",
    variant: "outlined",
    ringEnabled: true,
    animateRingOnFocus: true,
  },
  {
    id: "taxAddressLine2",
    kind: FieldKind.text,
    label: "Tax Address Line 2",
    row: 5,
    placeholder: "Suite / Unit",
    required: false,
    size: "md",
    variant: "outlined",
    ringEnabled: true,
    animateRingOnFocus: true,
  },
    {
      id: "taxAddressCity",
      kind: FieldKind.text,
      label: "Tax City",
      row: 5,
      placeholder: "City",
      required: true,
      size: "md",
    variant: "outlined",
    ringEnabled: true,
    animateRingOnFocus: true,
  },
    {
      id: "taxAddressState",
      kind: FieldKind.select,
      label: "Tax State",
      row: 5,
      placeholder: "Select state",
      options: usStates,
      required: true,
    size: "md",
    variant: "outlined",
    ringEnabled: true,
    animateRingOnFocus: true,
  },
    {
      id: "taxAddressZip",
      kind: FieldKind.zip,
      label: "Tax ZIP",
      row: 6,
      placeholder: "00000",
    inputMask: "00000[-0000]",
    inputBlocker: "^\\d{0,9}$",
    required: true,
    size: "md",
    variant: "outlined",
    ringEnabled: true,
    animateRingOnFocus: true,
  },
];

export const buildBorrowerIntakeSections = (
  previousAddressRows = 1,
  initialValues?: Record<string, string>,
): DemoSection[] => {
  const count = Math.max(1, Math.floor(previousAddressRows));
  const safeCount = Math.min(count, 12);
  const taxAddressToggleId = "taxAddressSameAsCurrent";

  const identitySection: DemoSection = {
    id: "borrower-identity",
    title: "Borrower Identity",
    fields: applyInitialValues(
      [
        {
          id: "borrowerFirstName",
          kind: FieldKind.text,
          label: "First Name",
          row: 1,
          placeholder: "John",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "borrowerLastName",
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
          id: "borrowerDob",
          kind: FieldKind.date,
          label: "Date of Birth",
          row: 1,
          placeholder: "YYYY-MM-DD",
          required: true,
          clearable: false,
          closeOnSelect: true,
          disableFuture: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "borrowerSsn",
          kind: FieldKind.ssn,
          label: "Social Security Number",
          row: 1,
          placeholder: "___-__-____",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          helperText: "Stored as digits only.",
        },
        {
          id: "borrowerMaritalStatus",
          kind: FieldKind.select,
          label: "Marital Status",
          row: 2,
          placeholder: "Select status",
          options: [
            {label: "Single", value: "single"},
            {label: "Married", value: "married"},
            {label: "Separated", value: "separated"},
            {label: "Divorced", value: "divorced"},
          ],
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

  const contactSection: DemoSection = {
    id: "borrower-contact",
    title: "Contact",
    fields: applyInitialValues(
      [
        {
          id: "borrowerPhone",
          kind: FieldKind.phone,
          label: "Phone",
          row: 1,
          placeholder: "(___) ___-____",
          inputMask: "(___) ___-____",
          inputBlocker: "^\\d{0,10}$",
          required: true,
          size: "md",
          variant: "outlined",
          startAdornment: "US",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "borrowerEmail",
          kind: FieldKind.text,
          label: "Email",
          row: 1,
          type: "email",
          placeholder: "name@email.com",
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

  const loanSection: DemoSection = {
    id: "loan-details",
    title: "Loan Details",
    fields: applyInitialValues(
      [
        {
          id: "loanPurpose",
          kind: FieldKind.select,
          label: "Loan Purpose",
          row: 1,
          placeholder: "Select purpose",
          options: [
            {label: "Purchase", value: "purchase"},
            {label: "Refinance", value: "refinance"},
            {label: "Construction", value: "construction"},
            {label: "Home Equity", value: "home-equity"},
          ],
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "propertyType",
          kind: FieldKind.select,
          label: "Property Type",
          row: 1,
          placeholder: "Select property type",
          options: [
            {label: "Single-Family Home", value: "single-family"},
            {label: "Townhouse", value: "townhouse"},
            {label: "Condominium", value: "condo"},
            {label: "Multi-Family", value: "multi-family"},
          ],
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "propertyUse",
          kind: FieldKind.select,
          label: "Property Use",
          row: 1,
          placeholder: "Select property use",
          options: [
            {label: "Primary Residence", value: "primary"},
            {label: "Second Home", value: "secondary"},
            {label: "Investment", value: "investment"},
            {label: "Vacation", value: "vacation"},
          ],
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "purchasePrice",
          kind: FieldKind.currency,
          label: "Purchase Price",
          row: 1,
          placeholder: "0.00",
          required: false,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          helperText: "If available",
        },
        {
          id: "loanAmount",
          kind: FieldKind.currency,
          label: "Requested Loan Amount",
          row: 2,
          placeholder: "0.00",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "downPayment",
          kind: FieldKind.percent,
          label: "Down Payment Amount",
          row: 2,
          placeholder: "0.00",
          required: false,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          helperText: "Decimal percent format",
        },
      ],
      initialValues,
    ),
  };

  const addressSection: DemoSection = {
    id: "current-address",
    title: "Current Residence and Tax Address",
    fields: applyInitialValues(
      [
        {
          id: "currentAddressLine1",
          kind: FieldKind.text,
          label: "Current Address Line 1",
          row: 1,
          placeholder: "123 Borrower Lane",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "currentAddressLine2",
          kind: FieldKind.text,
          label: "Current Address Line 2",
          row: 1,
          placeholder: "Apt, Unit, Suite",
          required: false,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "currentAddressCity",
          kind: FieldKind.text,
          label: "Current City",
          row: 1,
          placeholder: "City",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "currentAddressState",
          kind: FieldKind.select,
          label: "Current State",
          row: 1,
          placeholder: "Select state",
          options: usStates,
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "currentAddressZip",
          kind: FieldKind.zip,
          label: "Current ZIP",
          row: 2,
          placeholder: "00000",
          inputMask: "00000[-0000]",
          inputBlocker: "^\\d{0,9}$",
          required: true,
          size: "md",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: taxAddressToggleId,
          kind: FieldKind.switch,
          label: "Tax address is the same as current address",
          row: 2,
          required: false,
          size: "sm",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
          helperText: "Enable to hide tax address fields and use the current address.",
          triggers: [
            {
              when: {
                operator: WhenOperators.equals,
                value: "true",
              },
              operations: [
                {fieldIds: ["taxAddressLine1", "taxAddressLine2", "taxAddressCity", "taxAddressState", "taxAddressZip"], operator: TriggerOperators.setHidden, value: true},
                {fieldIds: ["taxAddressLine1", "taxAddressLine2", "taxAddressCity", "taxAddressState", "taxAddressZip"], operator: TriggerOperators.setDisabled, value: true},
                {fieldIds: ["taxAddressLine1", "taxAddressLine2", "taxAddressCity", "taxAddressState", "taxAddressZip"], operator: TriggerOperators.setValue, value: ""},
              ],
            },
            {
              when: {
                operator: WhenOperators.notEquals,
                value: "true",
              },
              operations: [
                {fieldIds: ["taxAddressLine1", "taxAddressLine2", "taxAddressCity", "taxAddressState", "taxAddressZip"], operator: TriggerOperators.setHidden, value: false},
                {fieldIds: ["taxAddressLine1", "taxAddressLine2", "taxAddressCity", "taxAddressState", "taxAddressZip"], operator: TriggerOperators.setDisabled, value: false},
              ],
            },
          ],
        },
        ...buildTaxAddressFields(),
      ],
      initialValues,
    ),
  };

  const previousSection: DemoSection = {
    id: "previous-addresses",
    title: "Previous Addresses",
    fields: applyInitialValues(
      Array.from({length: safeCount}, (_, index) => buildPreviousAddressFields(index)).flat(),
      initialValues,
    ),
  };

  return [identitySection, contactSection, loanSection, addressSection, previousSection];
};

export const buildBorrowerIntakeFormSpec = (
  previousAddressRows = 1,
  initialValues?: Record<string, string>,
): FormSpec => {
  const sections = buildBorrowerIntakeSections(previousAddressRows, initialValues);

  return {
    id: "borrower-intake",
    fields: sections.flatMap((section) => section.fields),
  };
};
