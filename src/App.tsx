import {createSignal, onCleanup, onMount, type Component} from "solid-js";
import {TelepathicFormDemo} from "./TelepathicForm";

const normalizePath = (path: string) => {
  if (!path) return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
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

  if (path() === "/form-demo") return <TelepathicFormDemo />;

  return (
    <div style={{padding: "24px", "font-family": "system-ui, sans-serif"}}>
      <h1>Route Not Found</h1>
      <p>
        Open <a href="/form-demo">/form-demo</a> to view the demo.
      </p>
    </div>
  );
};

export default App;
