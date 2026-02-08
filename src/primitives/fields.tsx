import {createMemo, Component, For, JSX} from "solid-js";

type TextFieldPrimitiveProps = {
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
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export const TextFieldPrimitive: Component<TextFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
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
          width: "360px",
          flex: isInline ? "1 1 360px" : undefined,
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
            width: p.rightSlot ? "100%" : "360px",
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

type TextAreaFieldPrimitiveProps = {
  id?: string;
  label?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  rows?: number;
  requiredDot?: boolean;
  inline?: boolean;
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

export const TextAreaFieldPrimitive: Component<TextAreaFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
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

      <textarea
        id={p.id}
        value={p.value}
        rows={p.rows ?? 4}
        placeholder={p.placeholder}
        disabled={p.disabled}
        aria-invalid={!!p.errorText}
        aria-describedby={describedBy()}
        onInput={(e) => p.onInput((e.currentTarget as HTMLTextAreaElement).value)}
        onBlur={() => p.onBlur?.()}
        onFocus={() => p.onFocus?.()}
        style={{
          width: "360px",
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
          "min-height": "96px",
          resize: "vertical",
          flex: isInline ? "1 1 360px" : undefined,
        }}
      />

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

type SelectOption = {label: string; value: string};

type SelectFieldPrimitiveProps = {
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
  onChange: (next: string) => void;
  onBlur?: () => void;
};

export const SelectFieldPrimitive: Component<SelectFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
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
          width: "360px",
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
          "background-color": "white",
          flex: isInline ? "1 1 360px" : undefined,
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

type CheckboxFieldPrimitiveProps = {
  id?: string;
  label?: string;
  checked: boolean;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  inline?: boolean;
  onChange: (next: boolean) => void;
};

export const CheckboxFieldPrimitive: Component<CheckboxFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <label style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px"}}>
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

type RadioGroupFieldPrimitiveProps = {
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
  onChange: (next: string) => void;
};

export const RadioGroupFieldPrimitive: Component<RadioGroupFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <div style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px"}}>
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

type InlineRowProps = {
  children: JSX.Element;
  gap?: string;
  align?: string;
};

export const InlineRow: Component<InlineRowProps> = (p) => {
  return (
    <div
      style={{
        display: "flex",
        "align-items": p.align ?? "center",
        gap: p.gap ?? "12px",
        "flex-wrap": "wrap",
      }}
    >
      {p.children}
    </div>
  );
};
