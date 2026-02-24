import {onCleanup, onMount, type Component} from "solid-js";
import {Dynamic} from "solid-js/web";
import {path, setPath, navigateTo} from "./router";
import {TelepathicFormDemo} from "./TelepathicForm";
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
import DesignerPage from "./designer-tool/DesignerPage";

const normalizePath = (p: string) => {
  if (!p) return "/";
  const trimmed = p.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

const routes: Record<string, Component> = {
  "/form-demo": TelepathicFormDemo,
  "/text-field": TextFieldPlayground,
  "/select": SelectPlayground,
  "/multi-select": MultiSelectPlayground,
  "/checkbox": CheckboxPlayground,
  "/radio-group": RadioGroupPlayground,
  "/switch": SwitchPlayground,
  "/textarea": TextAreaPlayground,
  "/date": DatePickerPlayground,
  "/slider": SliderPlayground,
  "/date-range": DateRangePickerPlayground,
  "/designer": DesignerPage,
};

const NotFound: Component = () => (
  <div style={{padding: "24px", "font-family": "system-ui, sans-serif"}}>
    <h1>Route Not Found</h1>
    <p>
      Try one of these routes:{" "}
      <a href="/designer" onClick={(e) => { e.preventDefault(); navigateTo("/designer"); }}>/designer</a>,{" "}
      <a href="/form-demo" onClick={(e) => { e.preventDefault(); navigateTo("/form-demo"); }}>/form-demo</a>,{" "}
      <a href="/text-field" onClick={(e) => { e.preventDefault(); navigateTo("/text-field"); }}>/text-field</a>,{" "}
      <a href="/select" onClick={(e) => { e.preventDefault(); navigateTo("/select"); }}>/select</a>,{" "}
      <a href="/multi-select" onClick={(e) => { e.preventDefault(); navigateTo("/multi-select"); }}>/multi-select</a>,{" "}
      <a href="/checkbox" onClick={(e) => { e.preventDefault(); navigateTo("/checkbox"); }}>/checkbox</a>,{" "}
      <a href="/radio-group" onClick={(e) => { e.preventDefault(); navigateTo("/radio-group"); }}>/radio-group</a>,{" "}
      <a href="/switch" onClick={(e) => { e.preventDefault(); navigateTo("/switch"); }}>/switch</a>,{" "}
      <a href="/textarea" onClick={(e) => { e.preventDefault(); navigateTo("/textarea"); }}>/textarea</a>,{" "}
      <a href="/date" onClick={(e) => { e.preventDefault(); navigateTo("/date"); }}>/date</a>,{" "}
      <a href="/slider" onClick={(e) => { e.preventDefault(); navigateTo("/slider"); }}>/slider</a>,{" "}
      <a href="/date-range" onClick={(e) => { e.preventDefault(); navigateTo("/date-range"); }}>/date-range</a>.
    </p>
  </div>
);

const App: Component = () => {
  const handlePopState = () => setPath(normalizePath(window.location.pathname));

  onMount(() => {
    window.addEventListener("popstate", handlePopState);

    if (path() === "/") {
      window.history.replaceState({}, "", "/form-demo");
      setPath("/form-demo");
    }
  });

  onCleanup(() => {
    window.removeEventListener("popstate", handlePopState);
  });

  return (
    <Dynamic component={routes[path()] ?? NotFound} />
  );
};

export default App;
