import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";
import { FormRenderer, buildGraphFromFormSpec, type FormSpec } from "../engine/generators";

type FormPreviewProps = {
  formSpec: FormSpec;
};

type PreviewRuntime = {
  formSpec: FormSpec;
  handlesById: ReturnType<typeof buildGraphFromFormSpec>["handlesById"];
};

const FormPreview: Component<FormPreviewProps> = (props) => {
  const [runtime, setRuntime] = createSignal<PreviewRuntime | null>(null);

  const formSpecSignature = createMemo(() =>
    props.formSpec.fields
      .map(
        (field) =>
          `${field.id}|${field.kind}|${field.row ?? "unassigned"}|${field.label ?? ""}|${field.placeholder ?? ""}|${field.helperText ?? ""}`,
      )
      .join("::"),
  );

  createEffect(() => {
    formSpecSignature();
    const { graph, handlesById: nextHandlesById } = buildGraphFromFormSpec(
      props.formSpec,
    );
    setRuntime({
      formSpec: props.formSpec,
      handlesById: nextHandlesById,
    });
    onCleanup(() => graph.destroy());
  });

  return (
    <div class="flex h-full min-h-0 flex-col rounded-lg border border-slate-300 bg-white p-3">
      <div class="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4">
        <Show when={runtime()}>
          {(safeRuntime) => (
            <FormRenderer
              form={safeRuntime().formSpec}
              handlesById={safeRuntime().handlesById}
            />
          )}
        </Show>
      </div>
    </div>
  );
};

export default FormPreview;
