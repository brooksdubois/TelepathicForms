import {createMemo, type Component, type JSX} from "solid-js";

export type TextFieldPrimitiveProps = {
  id?: string;
  label?: string;
  type?: string;
  inputMode?: JSX.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  rightSlot?: JSX.Element;
  requiredDot?: boolean;
  inline?: boolean;
  fullWidth?: boolean;
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export const TextFieldPrimitive: Component<TextFieldPrimitiveProps> = (p) => {
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

      <div
        style={{
          display: "flex",
          gap: "6px",
          "align-items": "center",
          width: controlWidth,
          flex: isInline || p.fullWidth ? "1 1 360px" : undefined,
        }}
      >
        <input
          id={p.id}
          type={p.type ?? "text"}
          inputMode={p.inputMode}
          value={p.value}
          placeholder={p.placeholder}
          disabled={p.disabled}
          aria-invalid={!!p.errorText}
          aria-describedby={describedBy()}
          onInput={(e) => p.onInput((e.currentTarget as HTMLInputElement).value)}
          onBlur={() => p.onBlur?.()}
          onFocus={() => p.onFocus?.()}
          onKeyDown={(e) => p.onKeyDown?.(e as KeyboardEvent)}
          style={{
            width: p.rightSlot || p.fullWidth ? "100%" : "360px",
            padding: "10px 12px",
            "border-radius": "10px",
            border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
            outline: "none",
            "font-size": "14px",
            opacity: p.disabled ? 0.6 : 1,
          }}
        />
        {p.rightSlot}
      </div>

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
