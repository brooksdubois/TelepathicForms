import type {Component} from "solid-js";
import {RadioField, type RadioFieldProps} from "./RadioField";

export type InlineRadioFieldProps = Omit<RadioFieldProps, "inline">;

export const InlineRadioField: Component<InlineRadioFieldProps> = (p) => {
  return <RadioField {...p} inline={true} />;
};
