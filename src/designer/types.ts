import type { FormSpec } from "../engine/types";

export type DesignerSelection =
  | {
      kind: "row" | "field";
      id: string;
    }
  | null;

export type { FormSpec };
