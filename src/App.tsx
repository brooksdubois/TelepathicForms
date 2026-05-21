import {For, onCleanup, onMount, type Component} from "solid-js";
import {Dynamic} from "solid-js/web";
import {path, setPath, navigateTo, currentRoutePath, routeHref} from "./router";
import {appRoutes, defaultRoutePath} from "./routes";
import {routeComponentByPath} from "./routeComponents";

const NotFound: Component = () => (
  <div style={{padding: "24px", "font-family": "system-ui, sans-serif"}}>
    <h1>Route Not Found</h1>
    <p>
      Try one of these routes:{" "}
      <For each={appRoutes}>
        {(route, index) => (
          <>
            <a href={routeHref(route.path)} onClick={(e) => { e.preventDefault(); navigateTo(route.path); }}>{route.path}</a>
            {index() === appRoutes.length - 1 ? "." : ", "}
          </>
        )}
      </For>
    </p>
  </div>
);

const App: Component = () => {
  const handleRouteChange = () => setPath(currentRoutePath());

  onMount(() => {
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);

    if (path() === "/") {
      navigateTo(defaultRoutePath, { replace: true });
    }
  });

  onCleanup(() => {
    window.removeEventListener("popstate", handleRouteChange);
    window.removeEventListener("hashchange", handleRouteChange);
  });

  return (
    <Dynamic component={routeComponentByPath[path()] ?? NotFound} />
  );
};

export default App;
