import type { Component } from "solid-js";
import { appRoutes, type AppRouteComponentKey } from "./routes";
import { TelepathicFormDemo } from "./TelepathicForm";
import CheckboxPlayground from "./playgrounds/CheckboxPlayground";
import MultiSelectPlayground from "./playgrounds/MultiSelectPlayground";
import RadioGroupPlayground from "./playgrounds/RadioGroupPlayground";
import SelectPlayground from "./playgrounds/SelectPlayground";
import SwitchPlayground from "./playgrounds/SwitchPlayground";
import TextAreaPlayground from "./playgrounds/TextAreaPlayground";
import TextFieldPlayground from "./playgrounds/TextFieldPlayground";
import DatePickerPlayground from "./playgrounds/DatePickerPlayground";
import SliderPlayground from "./playgrounds/SliderPlayground";
import DateRangePickerPlayground from "./playgrounds/DateRangePickerPlayground";
import TimePickerPlayground from "./playgrounds/TimePickerPlayground";
import DesignerPage from "./designer-tool/DesignerPage";

const componentByKey: Record<AppRouteComponentKey, Component> = {
  formDemo: TelepathicFormDemo,
  textField: TextFieldPlayground,
  select: SelectPlayground,
  multiSelect: MultiSelectPlayground,
  checkbox: CheckboxPlayground,
  radioGroup: RadioGroupPlayground,
  switch: SwitchPlayground,
  textArea: TextAreaPlayground,
  date: DatePickerPlayground,
  slider: SliderPlayground,
  dateRange: DateRangePickerPlayground,
  time: TimePickerPlayground,
  designer: DesignerPage,
};

export const routeComponentByPath = Object.fromEntries(
  appRoutes.map((route) => [route.path, componentByKey[route.componentKey]]),
) as Record<string, Component>;
