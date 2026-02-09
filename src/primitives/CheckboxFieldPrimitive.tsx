import {createMemo, type Component} from "solid-js";

export type CheckboxFieldPrimitiveProps = {
  id?: string;
  label?: string;
  checked: boolean;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  inline?: boolean;
  fullWidth?: boolean;
  onChange: (next: boolean) => void;
};

export const CheckboxFieldPrimitive: Component<CheckboxFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <label style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px", width: p.fullWidth ? "100%" : undefined}}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          "flex-wrap": p.inline ? "wrap" : "nowrap",
        }}
      >
        <input
          id={p.id}
          type="checkbox"
          checked={p.checked}
          disabled={p.disabled}
          aria-invalid={!!p.errorText}
          aria-describedby={describedBy()}
          onChange={(e) => p.onChange((e.currentTarget as HTMLInputElement).checked)}
        />
        {p.label && <div style={{"font-size": "14px"}}>{p.label}</div>}
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
    </label>
  );
};
