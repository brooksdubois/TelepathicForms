import {createMemo, For, type Component} from "solid-js";
import type {SelectOption} from "./SelectFieldPrimitive";

export type RadioGroupFieldPrimitiveProps = {
  id?: string;
  label?: string;
  name: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  inline?: boolean;
  requiredDot?: boolean;
  fullWidth?: boolean;
  onChange: (next: string) => void;
};

export const RadioGroupFieldPrimitive: Component<RadioGroupFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <div style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px", width: p.fullWidth ? "100%" : undefined}}>
      {p.label && (
        <div style={{"font-size": "12px", "margin-bottom": "6px", opacity: 0.8, "font-weight": 600}}>
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-describedby={describedBy()}
        style={{
          display: p.inline ? "flex" : "grid",
          gap: p.inline ? "12px" : "6px",
          "align-items": "center",
          "flex-wrap": p.inline ? "wrap" : "nowrap",
        }}
      >
        <For each={p.options}>
          {(opt) => (
            <label style={{display: "flex", "align-items": "center", gap: "6px"}}>
              <input
                type="radio"
                name={p.name}
                value={opt.value}
                checked={p.value === opt.value}
                disabled={p.disabled}
                aria-invalid={!!p.errorText}
                onChange={(e) => p.onChange((e.currentTarget as HTMLInputElement).value)}
              />
              <div style={{"font-size": "14px"}}>{opt.label}</div>
            </label>
          )}
        </For>
      </div>

      <div
        id={describedBy()}
        style={{
          "margin-top": "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </div>
  );
};
