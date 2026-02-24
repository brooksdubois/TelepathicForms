import type { FieldSpec, FormSpec } from "../engine/types";

export type GroupedRow = {
  id: string;
  label: string;
  fields: FieldSpec[];
  rowNumber?: number;
};

export type ParsedRowSelection =
  | { kind: "number"; rowNumber: number }
  | { kind: "unassigned" }
  | null;

export const parseRowSelectionId = (rowId: string): ParsedRowSelection => {
  if (rowId === "row-unassigned") {
    return { kind: "unassigned" };
  }

  const match = /^row-(\d+)$/.exec(rowId);
  if (!match) return null;

  return { kind: "number", rowNumber: Number(match[1]) };
};

export const groupFormSpecRows = (formSpec: FormSpec): GroupedRow[] => {
  const groupedRows = new Map<number, FieldSpec[]>();
  const unassignedFields: FieldSpec[] = [];

  for (const field of formSpec.fields) {
    if (typeof field.row === "number") {
      const existing = groupedRows.get(field.row) ?? [];
      groupedRows.set(field.row, [...existing, field]);
      continue;
    }

    unassignedFields.push(field);
  }

  const rows = [...groupedRows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rowNumber, fields]) => ({
      id: `row-${rowNumber}`,
      label: `Row ${rowNumber}`,
      fields,
      rowNumber,
    }));

  if (unassignedFields.length > 0) {
    rows.push({
      id: "row-unassigned",
      label: `Row ${rows.length + 1}`,
      fields: unassignedFields,
    });
  }

  return rows;
};
