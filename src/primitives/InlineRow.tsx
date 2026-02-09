import type {Component, JSX} from "solid-js";

export type InlineRowProps = {
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
