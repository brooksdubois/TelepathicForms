import { createMemo, createSignal, For, onCleanup, onMount, type Component } from "solid-js";
import {FieldSlot, groupFieldsByRow} from "./fieldRendering";
import type {FieldHandle, FormSpec} from "./types";
import type {AccentTheme} from "../theme/theme";
import { theme as activeTheme } from "../theme/theme";

export type FormRendererProps = {
  form: FormSpec;
  handlesById: Map<string, FieldHandle>;
  theme?: AccentTheme;
};

export const FormRenderer: Component<FormRendererProps> = (p) => {
  const groupedRows = createMemo(() => groupFieldsByRow(p.form.fields));
  const [responsiveColumnCount, setResponsiveColumnCount] = createSignal<1 | 2 | null>(null);
  const resolvedTheme = createMemo(() => p.theme ?? activeTheme() ?? p.form.theme);

  onMount(() => {
    const smallQuery = window.matchMedia("(max-width: 767px)");
    const mediumQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const syncLayout = () => {
      setResponsiveColumnCount(smallQuery.matches ? 1 : mediumQuery.matches ? 2 : null);
    };

    syncLayout();

    smallQuery.addEventListener("change", syncLayout);
    mediumQuery.addEventListener("change", syncLayout);
    onCleanup(() => {
      smallQuery.removeEventListener("change", syncLayout);
      mediumQuery.removeEventListener("change", syncLayout);
    });
  });

  return (
    <div
      data-tf-theme={resolvedTheme()}
      style={{display: "flex", "flex-direction": "column", gap: "20px", width: "100%"}}
    >
      {responsiveColumnCount() ? (
        <div
          style={{
            display: "grid",
            "align-items": "flex-start",
            gap: "20px 12px",
            width: "100%",
            "grid-template-columns": `repeat(${responsiveColumnCount()}, minmax(0, 1fr))`,
          }}
        >
          <For each={p.form.fields}>
            {(f) => {
              const handle = p.handlesById.get(f.id);
              if (!handle) return null;
              return <FieldSlot f={f} handle={handle} fullWidth={true} wrapInRow={true} />;
            }}
          </For>
        </div>
      ) : (
        <For each={groupedRows()}>
          {(row) =>
            row.sharedRow ? (
              <div
                style={{
                  display: "grid",
                  "align-items": "flex-start",
                  gap: "12px",
                  width: "100%",
                  "grid-template-columns": `repeat(${Math.max(1, row.fields.length)}, minmax(0, 1fr))`,
                }}
              >
                <For each={row.fields}>
                  {(f) => {
                    const handle = p.handlesById.get(f.id);
                    if (!handle) return null;
                    return <FieldSlot f={f} handle={handle} fullWidth={true} wrapInRow={true} />;
                  }}
                </For>
              </div>
            ) : (
              (() => {
                const f = row.fields[0];
                const handle = p.handlesById.get(f.id);
                if (!handle) return null;
                return <FieldSlot f={f} handle={handle} />;
              })()
            )
          }
        </For>
      )}
    </div>
  );
};
