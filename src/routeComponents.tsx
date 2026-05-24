import { lazy, type Component } from "solid-js";
import { appRoutes, type AppRouteComponentKey } from "./routes";

const componentByKey: Record<AppRouteComponentKey, Component> = {
  formDemo: lazy(() =>
    import("./form-demo/TelepathicFormDemo").then((module) => ({
      default: module.TelepathicFormDemo,
    })),
  ),
  textField: lazy(() => import("./playgrounds/TextFieldPlayground")),
  select: lazy(() => import("./playgrounds/SelectPlayground")),
  multiSelect: lazy(() => import("./playgrounds/MultiSelectPlayground")),
  checkbox: lazy(() => import("./playgrounds/CheckboxPlayground")),
  radioGroup: lazy(() => import("./playgrounds/RadioGroupPlayground")),
  switch: lazy(() => import("./playgrounds/SwitchPlayground")),
  textArea: lazy(() => import("./playgrounds/TextAreaPlayground")),
  date: lazy(() => import("./playgrounds/DatePickerPlayground")),
  slider: lazy(() => import("./playgrounds/SliderPlayground")),
  dateRange: lazy(() => import("./playgrounds/DateRangePickerPlayground")),
  time: lazy(() => import("./playgrounds/TimePickerPlayground")),
  designer: lazy(() => import("./designer-tool/DesignerPage")),
};

export const routeComponentByPath = Object.fromEntries(
  appRoutes.map((route) => [route.path, componentByKey[route.componentKey]]),
) as Record<string, Component>;
