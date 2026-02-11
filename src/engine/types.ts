import type {BehaviorSubject, Observable} from "rxjs";

export type Validator<T> = (value: T) => string[];
export type Formatter = (raw: string) => string;
export type Normalizer = (raw: string) => string;

export enum FieldKind {
  date = "date",
  textArea = "textArea",
  phone = "phone",
  text = "text",
  number = "number",
  currency = "currency",
  percent = "percent",
  select = "select",
  multiSelect = "multiSelect",
  checkbox = "checkbox",
  inlineCheckbox = "inlineCheckbox",
  switch = "switch",
  radio = "radio",
  inlineRadio = "inlineRadio",
  ssn = "ssn",
  zip = "zip",
  password = "password",
}

export type FieldOption = {
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
  helperText?: string;
};

export type FieldSpec = {
  id: string;
  kind: FieldKind;
  label: string;
  row?: number;
  placeholder?: string;
  helperText?: string;
  options?: FieldOption[];
  type?: string;
  autoComplete?: string;
  readOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  size?: "sm" | "md" | "lg";
  variant?: "outlined" | "filled" | "standard";
  startAdornment?: string;
  endAdornment?: string;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  rows?: number;
  autosize?: boolean;
  minRows?: number;
  maxRows?: number;
  searchable?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  shouldDisableDate?: (isoDate: string) => boolean;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  maxSelected?: number;
  indeterminate?: boolean;
  inline?: boolean;
  maxDigits?: number;
  required?: boolean;
  initialValue?: string;
  validate?: Validator<string>;
  inputMask?: string;
  inputBlocker?: string;
  triggers?: TriggerSpec[];
};

export enum OperatorMaths {
  all = "all",
  any = "any",
}

export enum WhenOperators {
  isValid = "isValid",
  isInvalid = "isInvalid",
  isEmpty = "isEmpty",
  equals = "equals",
  notEquals = "notEquals",
}

export enum TriggerOperators {
  setDisabled = "setDisabled",
  setValue = "setValue",
  setHidden = "setHidden",
}

export type WhenPredicate =
  | {
      fieldIds?: string[];
      operator: WhenOperators.isValid | WhenOperators.isInvalid | WhenOperators.isEmpty;
    }
  | {
      fieldIds?: string[];
      operator: WhenOperators.equals | WhenOperators.notEquals;
      value: string;
    };

export type WhenClause =
  | WhenOperators
  | WhenPredicate
  | {
      [OperatorMaths.all]?: WhenPredicate | WhenPredicate[];
      [OperatorMaths.any]?: WhenPredicate | WhenPredicate[];
    };

export type TriggerOperation =
  | {
      fieldIds: string[];
      operator: TriggerOperators.setDisabled;
      value: boolean;
    }
  | {
      fieldIds: string[];
      operator: TriggerOperators.setValue;
      value: string;
    }
  | {
      fieldIds: string[];
      operator: TriggerOperators.setHidden;
      value: boolean;
    };

export type TriggerSpec =
  | {
      when: WhenClause;
      operation: TriggerOperation;
    }
  | {
      when: WhenClause;
      operations: TriggerOperation[];
    };

export type FormSpec = {
  id: string;
  fields: FieldSpec[];
};

export type FieldHandle = {
  value$: BehaviorSubject<string>;
  disabled$: Observable<boolean>;
  hidden$: Observable<boolean>;
  errors$: Observable<string[]>;
  touched$: Observable<boolean>;
  focused$: Observable<boolean>;
  valid$: Observable<boolean>;
  setValue: (next: string) => void;
  markTouched: () => void;
  setFocused: (f: boolean) => void;
};
