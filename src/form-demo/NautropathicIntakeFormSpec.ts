import {
  FieldKind,
  type FieldSpec,
  type FormSpec,
  TriggerOperators,
  WhenOperators,
} from "../engine/types";
import type {DemoSection} from "./MedicalIntakeFormSpec";

const baseField = {
  size: "md",
  variant: "outlined",
  ringEnabled: true,
  animateRingOnFocus: true,
} as const;

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

const optionalPhone = (
  id: string,
  label: string,
  row: number,
  helperText?: string,
): FieldSpec => ({
  id,
  kind: FieldKind.phone,
  label,
  row,
  placeholder: "(___) ___-____",
  inputMask: "(___) ___-____",
  inputBlocker: "^\\d{0,10}$",
  startAdornment: "US",
  helperText,
  validate: () => [],
  ...baseField,
});

const messagePermissionTriggers = (phoneId: string, checkboxId: string): FieldSpec["triggers"] => [
  {
    when: {fieldIds: [phoneId], operator: WhenOperators.isEmpty},
    operations: [
      {fieldIds: [checkboxId], operator: TriggerOperators.setDisabled, value: true},
      {fieldIds: [checkboxId], operator: TriggerOperators.setValue, value: ""},
    ],
  },
  {
    when: {fieldIds: [phoneId], operator: WhenOperators.notEquals, value: ""},
    operation: {fieldIds: [checkboxId], operator: TriggerOperators.setDisabled, value: false},
  },
];

const leaveMessageCheckbox = (id: string, row: number, phoneId: string): FieldSpec => ({
  id,
  kind: FieldKind.inlineCheckbox,
  label: "Leave a message on this line",
  row,
  helperText: "Yes when checked; No when unchecked.",
  triggers: messagePermissionTriggers(phoneId, id),
});

export const buildNautropathicIntakeSections = (
  initialValues?: Record<string, string>,
): DemoSection[] => {
  const patientInformation: DemoSection = {
    id: "nautropathic-patient-information",
    title: "Patient Information (Please Print)",
    fields: applyInitialValues(
      [
        {
          id: "nautropathicName",
          kind: FieldKind.text,
          label: "Name",
          row: 1,
          placeholder: "Full name",
          autoComplete: "name",
          ...baseField,
        },
        {
          id: "nautropathicDateOfBirth",
          kind: FieldKind.date,
          label: "Date of Birth",
          row: 1,
          placeholder: "YYYY-MM-DD",
          clearable: true,
          disableFuture: true,
          closeOnSelect: true,
          ...baseField,
        },
        {
          id: "nautropathicAge",
          kind: FieldKind.number,
          label: "Age",
          row: 1,
          placeholder: "Age",
          maxDigits: 3,
          ...baseField,
        },
        {
          id: "nautropathicGender",
          kind: FieldKind.inlineRadio,
          label: "Gender",
          row: 1,
          inline: true,
          options: [
            {label: "M", value: "m"},
            {label: "F", value: "f"},
          ],
          ...baseField,
        },
        {
          id: "nautropathicStreetAddress",
          kind: FieldKind.text,
          label: "Address (Street)",
          row: 2,
          placeholder: "Street address",
          autoComplete: "street-address",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicCity",
          kind: FieldKind.text,
          label: "City",
          row: 3,
          placeholder: "City",
          autoComplete: "address-level2",
          ...baseField,
        },
        {
          id: "nautropathicState",
          kind: FieldKind.text,
          label: "State",
          row: 3,
          placeholder: "State",
          autoComplete: "address-level1",
          ...baseField,
        },
        {
          id: "nautropathicZipCode",
          kind: FieldKind.zip,
          label: "Zip Code",
          row: 3,
          placeholder: "00000",
          inputMask: "00000[-0000]",
          inputBlocker: "^\\d{0,9}$",
          autoComplete: "postal-code",
          ...baseField,
        },
        optionalPhone("nautropathicHomePhone", "Phone (h)", 4, "Home phone"),
        optionalPhone("nautropathicCellPhone", "(c)", 4, "Cell phone"),
        optionalPhone("nautropathicWorkPhone", "(w)", 4, "Work phone"),
        {
          id: "nautropathicPreferredContactMethod",
          kind: FieldKind.select,
          label: "Preferred Method of Contact",
          row: 5,
          placeholder: "Select one",
          options: [
            {label: "Home Phone", value: "homePhone"},
            {label: "Cell Phone", value: "cellPhone"},
            {label: "Office Phone", value: "officePhone"},
            {label: "Email", value: "email"},
            {label: "Mail", value: "mail"},
          ],
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicSsn",
          kind: FieldKind.ssn,
          label: "SS#",
          row: 6,
          placeholder: "___-__-____",
          ...baseField,
        },
        {
          id: "nautropathicOccupation",
          kind: FieldKind.text,
          label: "Occupation",
          row: 6,
          placeholder: "Occupation",
          ...baseField,
        },
        {
          id: "nautropathicEmployerName",
          kind: FieldKind.text,
          label: "Name of Employer",
          row: 7,
          placeholder: "Employer name",
          triggers: [
            {
              when: {operator: WhenOperators.isEmpty},
              operations: [
                {fieldIds: ["nautropathicEmployerAddress"], operator: TriggerOperators.setDisabled, value: true},
                {fieldIds: ["nautropathicEmployerAddress"], operator: TriggerOperators.setValue, value: ""},
              ],
            },
            {
              when: {operator: WhenOperators.notEquals, value: ""},
              operation: {
                fieldIds: ["nautropathicEmployerAddress"],
                operator: TriggerOperators.setDisabled,
                value: false,
              },
            },
          ],
          ...baseField,
        },
        {
          id: "nautropathicEmployerAddress",
          kind: FieldKind.text,
          label: "Employer's Address",
          row: 7,
          placeholder: "Employer address",
          ...baseField,
        },
        {
          id: "nautropathicEmailAddress",
          kind: FieldKind.text,
          label: "Email Address",
          row: 8,
          type: "email",
          placeholder: "you@example.com",
          autoComplete: "email",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicRelationshipStatus",
          kind: FieldKind.text,
          label: "Marital/Relationship Status",
          row: 9,
          placeholder: "Status",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicParentGuardian",
          kind: FieldKind.text,
          label: "If Minor, Name of Parent/Guardian",
          row: 10,
          placeholder: "Parent or guardian name",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicChildrenDependents",
          kind: FieldKind.text,
          label: "Children/Dependents",
          row: 11,
          placeholder: "Children/dependents",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
      ],
      initialValues,
    ),
  };

  const emergencyAndReferral: DemoSection = {
    id: "nautropathic-emergency-referral",
    title: "Emergency Contact and Referral",
    fields: applyInitialValues(
      [
        {
          id: "nautropathicEmergencyContactName",
          kind: FieldKind.text,
          label: "Emergency Contact (Name)",
          row: 1,
          placeholder: "Emergency contact name",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicEmergencyRelationship",
          kind: FieldKind.text,
          label: "Relationship to you",
          row: 2,
          placeholder: "Relationship",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        optionalPhone("nautropathicEmergencyHomePhone", "Phone (h)", 3, "Emergency home phone"),
        optionalPhone("nautropathicEmergencyCellPhone", "(c)", 3, "Emergency cell phone"),
        optionalPhone("nautropathicEmergencyWorkPhone", "(w)", 3, "Emergency work phone"),
        {
          id: "nautropathicPrimaryCarePhysician",
          kind: FieldKind.text,
          label: "Primary Care Physician (Name & Phone)",
          row: 4,
          placeholder: "Physician name and phone",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicReferralSource",
          kind: FieldKind.textArea,
          label: "How did you hear about The Center For Natural Health, LLC?",
          row: 5,
          placeholder: "Referral source",
          rows: 2,
          autosize: true,
          minRows: 2,
          maxRows: 4,
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
        {
          id: "nautropathicInsuranceCompany",
          kind: FieldKind.text,
          label: "Name of Insurance Co.",
          row: 6,
          placeholder: "Insurance company",
          size: "lg",
          variant: "outlined",
          ringEnabled: true,
          animateRingOnFocus: true,
        },
      ],
      initialValues,
    ),
  };

  const authorization: DemoSection = {
    id: "nautropathic-message-authorization",
    title:
      "I authorize The Center For Natural Health, LLC to call and leave a message on the following:",
    fields: applyInitialValues(
      [
        optionalPhone("nautropathicAuthorizationHomePhone", "Home Phone", 1),
        leaveMessageCheckbox(
          "nautropathicAuthorizationHomeMessage",
          1,
          "nautropathicAuthorizationHomePhone",
        ),
        optionalPhone("nautropathicAuthorizationCellPhone", "Cell Phone", 2),
        leaveMessageCheckbox(
          "nautropathicAuthorizationCellMessage",
          2,
          "nautropathicAuthorizationCellPhone",
        ),
        optionalPhone("nautropathicAuthorizationOfficePhone", "Office Phone", 3),
        leaveMessageCheckbox(
          "nautropathicAuthorizationOfficeMessage",
          3,
          "nautropathicAuthorizationOfficePhone",
        ),
      ],
      initialValues,
    ),
  };

  const signature: DemoSection = {
    id: "nautropathic-signature",
    title: "Signature",
    fields: applyInitialValues(
      [
        {
          id: "nautropathicSignature",
          kind: FieldKind.text,
          label: "Signature",
          row: 1,
          placeholder: "Signature",
          ...baseField,
        },
        {
          id: "nautropathicPrintName",
          kind: FieldKind.text,
          label: "Print",
          row: 1,
          placeholder: "Printed name",
          ...baseField,
        },
        {
          id: "nautropathicSignatureDate",
          kind: FieldKind.date,
          label: "Date",
          row: 1,
          placeholder: "YYYY-MM-DD",
          clearable: true,
          closeOnSelect: true,
          ...baseField,
        },
      ],
      initialValues,
    ),
  };

  return [patientInformation, emergencyAndReferral, authorization, signature];
};

export const buildNautropathicIntakeFormSpec = (
  initialValues?: Record<string, string>,
): FormSpec => {
  const sections = buildNautropathicIntakeSections(initialValues);

  return {
    id: "nautropathic-intake",
    fields: sections.flatMap((section) => section.fields),
  };
};
