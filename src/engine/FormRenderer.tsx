import {For, type Component} from "solid-js";
import {FieldSlot, groupFieldsByRow} from "./fieldRendering";
import type {FieldHandle, FormSpec} from "./types";

export type FormRendererProps = {
  form: FormSpec;
  handlesById: Map<string, FieldHandle>;
};

export const FormRenderer: Component<FormRendererProps> = (p) => {
  const groupedRows = groupFieldsByRow(p.form.fields);

  return (
    <div>
      <For each={groupedRows}>
        {(row) =>
          row.sharedRow ? (
            <div
              style={{
                display: "flex",
                "align-items": "flex-start",
                "flex-wrap": "wrap",
                gap: "12px",
                width: "100%",
              }}
            >
              <For each={row.fields}>
                {(f) => {
                  const handle = p.handlesById.get(f.id);
                  if (!handle) throw new Error(`Missing FieldHandle for ${f.id}`);
                  return <FieldSlot f={f} handle={handle} fullWidth={true} wrapInRow={true} />;
                }}
              </For>
            </div>
          ) : (
            (() => {
              const f = row.fields[0];
              const handle = p.handlesById.get(f.id);
              if (!handle) throw new Error(`Missing FieldHandle for ${f.id}`);
              return <FieldSlot f={f} handle={handle} />;
            })()
          )
        }
      </For>
    </div>
  );
};
