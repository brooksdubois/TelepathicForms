import {createMemo, For, type Component} from "solid-js";

export type SelectOption = {label: string; value: string};

export type SelectFieldPrimitiveProps = {
  id?: string;
  label?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  requiredDot?: boolean;
  inline?: boolean;
  fullWidth?: boolean;
  onChange: (next: string) => void;
  onBlur?: () => void;
};

export const SelectFieldPrimitive: Component<SelectFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
  const controlWidth = p.fullWidth ? "100%" : "360px";
  const labelWidth = "180px";
  const helperIndent = "192px";

  return (
    <label
      style={
        isInline
          ? {
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
              "font-family": "system-ui",
              "margin-bottom": "12px",
            }
          : {display: "block", "font-family": "system-ui", "margin-bottom": "12px"}
      }
    >
      {p.label && (
        <div
          style={{
            "font-size": "12px",
            "margin-bottom": isInline ? "0" : "4px",
            opacity: 0.8,
            "font-weight": 600,
            width: isInline ? labelWidth : undefined,
            "flex-shrink": isInline ? 0 : undefined,
          }}
        >
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <select
        id={p.id}
        value={p.value}
        disabled={p.disabled}
        aria-invalid={!!p.errorText}
        aria-describedby={describedBy()}
        onChange={(e) => p.onChange((e.currentTarget as HTMLSelectElement).value)}
        onBlur={() => p.onBlur?.()}
        style={{
          width: controlWidth,
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
          "background-color": "white",
          flex: isInline || p.fullWidth ? "1 1 360px" : undefined,
        }}
      >
        {p.placeholder && <option value="">{p.placeholder}</option>}
        <For each={p.options}>
          {(opt) => <option value={opt.value}>{opt.label}</option>}
        </For>
      </select>

      <div
        id={describedBy()}
        style={{
          "margin-top": isInline ? "4px" : "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
          ...(isInline ? {"flex-basis": "100%", "margin-left": helperIndent} : {}),
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </label>
  );
};
