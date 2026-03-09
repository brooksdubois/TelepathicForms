import { createMemo, createSignal, For, onCleanup, onMount, type Component } from "solid-js";
import {FieldSlot, groupFieldsByRow} from "./fieldRendering";
import type {FieldHandle, FormSpec} from "./types";

export type FormRendererProps = {
  form: FormSpec;
  handlesById: Map<string, FieldHandle>;
};

export const FormRenderer: Component<FormRendererProps> = (p) => {
  const groupedRows = createMemo(() => groupFieldsByRow(p.form.fields));
  const [isMobileViewport, setIsMobileViewport] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();

    mediaQuery.addEventListener("change", syncViewport);
    onCleanup(() => mediaQuery.removeEventListener("change", syncViewport));
  });

  const rowColumnCount = (fieldCount: number) => {
    const safeFieldCount = Math.max(1, fieldCount);
    return isMobileViewport() ? Math.min(2, safeFieldCount) : safeFieldCount;
  };

  return (
    <div style={{display: "flex", "flex-direction": "column", gap: "20px", width: "100%"}}>
      <For each={groupedRows()}>
        {(row) =>
          row.sharedRow ? (
            <div
              style={{
                display: "grid",
                "align-items": "flex-start",
                gap: "12px",
                width: "100%",
                "grid-template-columns": `repeat(${rowColumnCount(row.fields.length)}, minmax(0, 1fr))`,
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
    </div>
  );
};
