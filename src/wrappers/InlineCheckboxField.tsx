import type {Component} from "solid-js";
import {CheckboxField, type CheckboxFieldProps} from "./CheckboxField";

export type InlineCheckboxFieldProps = Omit<CheckboxFieldProps, "inline">;

export const InlineCheckboxField: Component<InlineCheckboxFieldProps> = (p) => {
  return <CheckboxField {...p} inline={true} />;
};
