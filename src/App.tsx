import {createSignal, onCleanup, onMount, type Component} from "solid-js";
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

const normalizePath = (path: string) => {
  if (!path) return "/";
  const trimmed = path.replace(/\/+$/, "");
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
};

const App: Component = () => {
  const [path, setPath] = createSignal(normalizePath(window.location.pathname));

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

  const ActiveRoute = routes[path()];
  if (ActiveRoute) return <ActiveRoute />;

  return (
    <div style={{padding: "24px", "font-family": "system-ui, sans-serif"}}>
      <h1>Route Not Found</h1>
      <p>
        Try one of these routes: <a href="/form-demo">/form-demo</a>,{" "}
        <a href="/text-field">/text-field</a>, <a href="/select">/select</a>,{" "}
        <a href="/multi-select">/multi-select</a>,{" "}
        <a href="/checkbox">/checkbox</a>,{" "}
        <a href="/radio-group">/radio-group</a>, <a href="/switch">/switch</a>,{" "}
        <a href="/textarea">/textarea</a>, <a href="/date">/date</a>,{" "}
        <a href="/slider">/slider</a>.
      </p>
    </div>
  );
};

export default App;