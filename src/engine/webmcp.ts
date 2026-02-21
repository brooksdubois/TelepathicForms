// src/engine/webmcp.ts
import {onMount, onCleanup} from "solid-js";
import {FieldKind, type FormSpec, type FieldSpec, type FieldHandle} from "./types";

type JSONSchemaProp = {
  type: string;
  description?: string;
  enum?: string[];
  items?: {type: string; enum?: string[]};
};

export type ToolSchema = {
  type: "object";
  properties: Record<string, JSONSchemaProp>;
  required: string[];
};

export type WebMCPToolConfig = {
  toolName?: string;
  toolDescription?: string;
  autoSubmit?: boolean;
};

/** Convert FormSpec → JSON Schema (shared by WebMCP + Gemini) */
export function deriveToolSchema(spec: FormSpec): ToolSchema {
  const properties: Record<string, JSONSchemaProp> = {};
  const required: string[] = [];

  for (const f of spec.fields) {
    const prop: JSONSchemaProp = {
      type: "string",
      description: f.helperText ? `${f.label} — ${f.helperText}` : f.label,
    };

    switch (f.kind) {
      case FieldKind.select:
      case FieldKind.radio:
      case FieldKind.inlineRadio:
        prop.type = "string";
        if (f.options?.length) {
          prop.enum = f.options.filter((o) => o.value).map((o) => o.value);
          prop.description += ` (options: ${f.options.filter((o) => o.value).map((o) => `${o.value}=${o.label}`).join(", ")})`;
        }
        break;
      case FieldKind.multiSelect:
        prop.type = "array";
        prop.items = {type: "string", enum: f.options?.map((o) => o.value)};
        prop.description += ` (pick from: ${f.options?.map((o) => o.value).join(", ")})`;
        break;
      case FieldKind.checkbox:
      case FieldKind.inlineCheckbox:
      case FieldKind.switch:
        prop.type = "string";
        prop.enum = ["true", "false"];
        prop.description += ` (use "true" or "false")`;
        break;
      case FieldKind.number:
      case FieldKind.currency:
      case FieldKind.percent:
        prop.type = "string";
        prop.description += " (numeric string)";
        if (f.maxDigits) prop.description += `, max ${f.maxDigits} digits`;
        break;
      case FieldKind.phone:
        prop.type = "string";
        prop.description += " (10-digit US phone, digits only)";
        break;
      case FieldKind.ssn:
        prop.type = "string";
        prop.description += " (9-digit SSN, digits only, no dashes)";
        break;
      case FieldKind.zip:
        prop.type = "string";
        prop.description += " (5 or 9 digit US ZIP)";
        break;
      case FieldKind.date:
        prop.type = "string";
        prop.description += " (YYYY-MM-DD format)";
        break;
      case FieldKind.password:
        prop.type = "string";
        if (f.minLength) prop.description += `, min ${f.minLength} chars`;
        if (f.maxLength) prop.description += `, max ${f.maxLength} chars`;
        break;
      default:
        prop.type = "string";
        if (f.type === "email") prop.description += " (valid email format)";
        if (f.maxLength) prop.description += `, max ${f.maxLength} chars`;
        break;
    }

    properties[f.id] = prop;
    if (f.required) required.push(f.id);
  }

  return {type: "object", properties, required};
}

/** Convert FormSpec → Gemini functionDeclarations format */
export function getGeminiFunctionDeclaration(spec: FormSpec, config?: WebMCPToolConfig) {
  const schema = deriveToolSchema(spec);
  return {
    name: (config?.toolName ?? `fill_${spec.id}_form`).replace(/-/g, "_"),
    description:
      config?.toolDescription ??
      `Fill the "${spec.id}" form. ${spec.fields.map((f) => `${f.id}: ${f.label}`).join("; ")}`,
    parameters: schema,
  };
}

// ─── WebMCP ──────────────────────────────────────────────────────────
export function registerWebMCPTool(spec: FormSpec, handlesById: Map<string, FieldHandle>, config?: WebMCPToolConfig): boolean {
  if (!("modelContext" in navigator)) {
    console.info("[TelepathicForms] WebMCP not available. Enable chrome://flags → 'WebMCP for testing' (Chrome 146+)");
    return false;
  }
  const nav = navigator as any;
  const toolName = config?.toolName ?? `fill_${spec.id}_form`;
  const toolDescription = config?.toolDescription ?? `Fill the "${spec.id}" form. Fields: ${spec.fields.map((f) => f.label).join(", ")}`;
  try {
    nav.modelContext.registerTool({
      name: toolName,
      description: toolDescription,
      inputSchema: deriveToolSchema(spec),
      async handler(params: Record<string, any>) {
        const filled: string[] = [];
        const errors: string[] = [];
        for (const [fieldId, value] of Object.entries(params)) {
          const handle = handlesById.get(fieldId);
          if (!handle) { errors.push(`Unknown field: ${fieldId}`); continue; }
          try {
            handle.setValue(Array.isArray(value) ? value.join(",") : String(value));
            handle.markTouched();
            filled.push(fieldId);
          } catch (e) { errors.push(`Failed to set ${fieldId}: ${(e as Error).message}`); }
        }
        return {success: errors.length === 0, filled, errors: errors.length > 0 ? errors : undefined};
      },
    });
    console.info(`[TelepathicForms] WebMCP tool "${toolName}" registered ✓`);
    return true;
  } catch (e) {
    console.error("[TelepathicForms] WebMCP registration failed:", e);
    return false;
  }
}

export function getWebMCPFormAttributes(spec: FormSpec, config?: WebMCPToolConfig): Record<string, string> {
  return {
    toolname: config?.toolName ?? `fill_${spec.id}_form`,
    tooldescription: config?.toolDescription ?? `Fill the "${spec.id}" form. Fields: ${spec.fields.map((f) => f.label).join(", ")}`,
    ...(config?.autoSubmit ? {toolautosubmit: "true"} : {}),
  };
}

export function getWebMCPFieldAttributes(field: FieldSpec): Record<string, string> {
  return {toolparamdescription: field.helperText ? `${field.label}: ${field.helperText}` : field.label};
}

export function useWebMCP(spec: FormSpec, handlesById: Map<string, FieldHandle>, config?: WebMCPToolConfig) {
  let registered = false;
  onMount(() => { registered = registerWebMCPTool(spec, handlesById, config); });
  onCleanup(() => { if (registered) console.info("[TelepathicForms] Component unmounted, WebMCP tool was registered"); });
  return {
    get isRegistered() { return registered; },
    schema: deriveToolSchema(spec),
    formAttributes: getWebMCPFormAttributes(spec, config),
  };
}