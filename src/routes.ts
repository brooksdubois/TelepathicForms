export const appRoutes = [
  { path: "/form-demo", label: "Form Demo", componentKey: "formDemo", showInPlaygroundNav: true },
  { path: "/text-field", label: "TextField Lab", componentKey: "textField", showInPlaygroundNav: true },
  { path: "/select", label: "Select Lab", componentKey: "select", showInPlaygroundNav: true },
  { path: "/multi-select", label: "MultiSelect Lab", componentKey: "multiSelect", showInPlaygroundNav: true },
  { path: "/checkbox", label: "Checkbox Lab", componentKey: "checkbox", showInPlaygroundNav: true },
  { path: "/radio-group", label: "RadioGroup Lab", componentKey: "radioGroup", showInPlaygroundNav: true },
  { path: "/switch", label: "Switch Lab", componentKey: "switch", showInPlaygroundNav: true },
  { path: "/textarea", label: "TextArea Lab", componentKey: "textArea", showInPlaygroundNav: true },
  { path: "/date", label: "DatePicker Lab", componentKey: "date", showInPlaygroundNav: true },
  { path: "/slider", label: "Slider Lab", componentKey: "slider", showInPlaygroundNav: true },
  { path: "/date-range", label: "Date Range Lab", componentKey: "dateRange", showInPlaygroundNav: true },
  { path: "/time", label: "TimePicker Lab", componentKey: "time", showInPlaygroundNav: true },
  { path: "/designer", label: "Designer", componentKey: "designer", showInPlaygroundNav: false },
] as const;

export type AppRoute = (typeof appRoutes)[number];
export type AppRoutePath = AppRoute["path"];
export type AppRouteComponentKey = AppRoute["componentKey"];

export const defaultRoutePath: AppRoutePath = appRoutes[0].path;

export const appRoutePaths = appRoutes.map((route) => route.path);
export const appRoutePathSet = new Set<string>(appRoutePaths);
export const staticRoutePaths = appRoutes.map((route) => route.path.slice(1));
export const playgroundRoutes = appRoutes.filter((route) => route.showInPlaygroundNav);
export const routePathByComponent = Object.fromEntries(
  appRoutes.map((route) => [route.componentKey, route.path]),
) as Record<AppRouteComponentKey, AppRoutePath>;
