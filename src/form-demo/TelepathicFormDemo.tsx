import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import {
  buildGraphFromFormSpec,
  FormRenderer,
  type FieldSpec,
  type FormSpec,
} from "../engine/generators";
import {FieldKind, type FieldHandle} from "../engine/types";
import {registerWebMCPTool, getWebMCPFormAttributes} from "../engine/webmcp";
import {AIFormAssistant} from "../components/AIFormAssistant";
import PlaygroundNav from "../playgrounds/PlaygroundNav";
import {cx} from "../utils/cx";
import {SelectWrapper} from "../wrappers";
import {buildMedicalIntakeSections, type DemoSection} from "./MedicalIntakeFormSpec";
import {buildTradingSystemSections} from "./TradingSystemFormSpec";
import {buildBorrowerIntakeSections} from "./BorrowerIntakeFormSpec";
import {demoFormSpec} from "./DemoFormSpec";
import {BehaviorSubject, combineLatest} from "rxjs";

type DemoKey = "legacy" | "medical" | "borrower" | "trading";

type DemoRuntimeState = {
  key: DemoKey;
  label: string;
  sections: DemoSection[];
  spec: FormSpec;
  graph: ReturnType<typeof buildGraphFromFormSpec>["graph"];
  nodesById: Map<string, {value$: {getValue: () => string}}>;
  handlesById: ReturnType<typeof buildGraphFromFormSpec>["handlesById"];
};

const buildLegacySections = (initialValues?: Record<string, string>): DemoSection[] => {
  const hydrate = (field: FieldSpec) =>
    initialValues && Object.prototype.hasOwnProperty.call(initialValues, field.id)
      ? {...field, initialValue: initialValues[field.id]}
      : field;

  return [
    {
      id: "legacy-demo",
      title: "Legacy Contact Demo",
      fields: demoFormSpec.fields.map(hydrate),
    },
  ];
};

const collectValues = (
  nodesById?: Map<string, {value$: {getValue: () => string}}>,
): Record<string, string> => {
  const values: Record<string, string> = {};
  if (!nodesById) return values;

  for (const [fieldId, node] of nodesById) {
    values[fieldId] = node.value$.getValue();
  }
  return values;
};

const MAX_PRESCRIPTIONS = 12;
const MAX_PREVIOUS_ADDRESSES = 12;

export const TelepathicFormDemo: Component = () => {
  const [selectedDemo, setSelectedDemo] = createSignal<DemoKey>("legacy");
  const [prescriptionRows, setPrescriptionRows] = createSignal(1);
  const [previousAddressRows, setPreviousAddressRows] = createSignal(1);
  const [tradingExchange, setTradingExchange] = createSignal("");
  const [tradingMarket, setTradingMarket] = createSignal("");
  const [webmcpActive, setWebmcpActive] = createSignal(false);
  const [lastRegisteredDemoState, setLastRegisteredDemoState] = createSignal("");
  const [formState, setFormState] = createSignal<DemoRuntimeState | null>(null);
  let previousState: DemoRuntimeState | null = null;

  const demoSelectValue$ = new BehaviorSubject<string>(selectedDemo());
  const demoSelectErrors$ = new BehaviorSubject<string[]>([]);
  const demoSelectTouched$ = new BehaviorSubject<boolean>(false);
  const demoSelectFocused$ = new BehaviorSubject<boolean>(false);
  const demoSelectHandle: FieldHandle = {
    value$: demoSelectValue$,
    disabled$: new BehaviorSubject(false),
    hidden$: new BehaviorSubject(false),
    errors$: demoSelectErrors$,
    touched$: demoSelectTouched$,
    focused$: demoSelectFocused$,
    valid$: new BehaviorSubject(true),
    setValue: (next) => {
      demoSelectValue$.next(next);
      const nextDemo = next as DemoKey;
      setSelectedDemo(nextDemo);
      if (nextDemo !== "medical") setPrescriptionRows(1);
      if (nextDemo !== "borrower") setPreviousAddressRows(1);
      if (nextDemo !== "trading") {
        setTradingExchange("");
        setTradingMarket("");
      }
      demoSelectTouched$.next(true);
      demoSelectFocused$.next(false);
    },
    markTouched: () => {
      demoSelectTouched$.next(true);
    },
    setFocused: (focused) => {
      demoSelectFocused$.next(focused);
    },
  };

  createEffect(() => {
    const key = selectedDemo();
    const initialValues = collectValues(previousState?.nodesById);

    const sections =
      key === "medical"
        ? buildMedicalIntakeSections(prescriptionRows(), initialValues)
        : key === "borrower"
          ? buildBorrowerIntakeSections(previousAddressRows(), initialValues)
          : key === "trading"
            ? buildTradingSystemSections(tradingExchange(), initialValues)
          : buildLegacySections(initialValues);

    const spec = {
      id:
        key === "medical"
          ? "medical-intake"
          : key === "borrower"
            ? "borrower-intake"
            : key === "trading"
              ? "trading-system"
              : "demo",
      fields: sections.flatMap((section) => section.fields),
    };

    const built = buildGraphFromFormSpec(spec);
    const subscriptions: Array<{unsubscribe: () => void}> = [];

    const nextState = {
      key,
      label:
        key === "medical"
          ? "Medical Intake Form"
          : key === "borrower"
            ? "Borrower Intake Form"
            : key === "trading"
              ? "Trading System Config"
              : "Contact Demo",
      sections,
      spec,
      graph: built.graph,
      nodesById: built.nodesById as Map<string, {value$: {getValue: () => string}}>,
      handlesById: built.handlesById,
    };

    if (key === "trading") {
      const exchangeNode = built.nodesById.get("tradingExchange");
      const marketNode = built.nodesById.get("tradingMarket");
      const entryNode = built.nodesById.get("tradingEntryPrice");
      const stopNode = built.nodesById.get("tradingStopPrice");
      const stopDistanceNode = built.nodesById.get("tradingStopDistancePct");
      const targetNode = built.nodesById.get("tradingTakeProfitPrice");
      const rewardRiskNode = built.nodesById.get("tradingRewardToRiskPct");
      const positionValueNode = built.nodesById.get("tradingPositionValue");
      const accountEquityNode = built.nodesById.get("tradingAccountEquity");
      const allocationNode = built.nodesById.get("tradingAllocationPct");

      const parseDecimal = (raw: string) => {
        const normalized = Number.parseFloat((raw ?? "").replace(/,/g, ""));
        return Number.isFinite(normalized) ? normalized : null;
      };
      const emitPercent = (value: number) => value.toFixed(6).replace(/\.?0+$/, "");

      if (exchangeNode) {
        subscriptions.push(exchangeNode.value$.subscribe((next) => setTradingExchange(next)));
      }
      if (marketNode) {
        subscriptions.push(marketNode.value$.subscribe((next) => setTradingMarket(next)));
      }

      if (entryNode && stopNode && stopDistanceNode) {
        subscriptions.push(
          combineLatest([entryNode.value$, stopNode.value$]).subscribe(([entryValue, stopValue]) => {
            const entry = parseDecimal(entryValue);
            const stop = parseDecimal(stopValue);
            if (entry === null || stop === null || entry === 0) {
              if (stopDistanceNode.value$.getValue() !== "") stopDistanceNode.setValue("");
              return;
            }

            const next = emitPercent(Math.abs((entry - stop) / entry) * 100);
            if (stopDistanceNode.value$.getValue() !== next) stopDistanceNode.setValue(next);
          }),
        );
      }

      if (entryNode && stopNode && targetNode && rewardRiskNode) {
        subscriptions.push(
          combineLatest([entryNode.value$, stopNode.value$, targetNode.value$]).subscribe(
            ([entryValue, stopValue, targetValue]) => {
              const entry = parseDecimal(entryValue);
              const stop = parseDecimal(stopValue);
              const target = parseDecimal(targetValue);

              if (entry === null || stop === null || target === null || entry === 0 || entry === stop) {
                if (rewardRiskNode.value$.getValue() !== "") rewardRiskNode.setValue("");
                return;
              }

              const denominator = Math.abs(entry - stop);
              if (denominator === 0) {
                if (rewardRiskNode.value$.getValue() !== "") rewardRiskNode.setValue("");
                return;
              }

              const next = emitPercent((Math.abs(target - entry) / denominator) * 100);
              if (rewardRiskNode.value$.getValue() !== next) rewardRiskNode.setValue(next);
            },
          ),
        );
      }

      if (positionValueNode && accountEquityNode && allocationNode) {
        subscriptions.push(
          combineLatest([positionValueNode.value$, accountEquityNode.value$]).subscribe(
            ([positionValue, accountEquity]) => {
              const position = parseDecimal(positionValue);
              const equity = parseDecimal(accountEquity);
              if (position === null || equity === null || equity === 0) {
                if (allocationNode.value$.getValue() !== "") allocationNode.setValue("");
                return;
              }

              const next = emitPercent((position / equity) * 100);
              if (allocationNode.value$.getValue() !== next) allocationNode.setValue(next);
            },
          ),
        );
      }
    }

    previousState = nextState;
    setFormState(nextState);

    onCleanup(() => {
      built.graph.destroy();
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    });
  });

  createEffect(() => {
    const current = formState();
    if (!current) return;
    const nextStateKey = `${current.key}:${current.spec.fields.length}`;
    if (lastRegisteredDemoState() === nextStateKey) return;

    const registered = registerWebMCPTool(current.spec, current.handlesById);
    setWebmcpActive(registered);
    setLastRegisteredDemoState(nextStateKey);
  });

  const current = createMemo(() => formState());
  const isMedicalDemo = createMemo(() => current()?.key === "medical");
  const isBorrowerDemo = createMemo(() => current()?.key === "borrower");
  const isTradingDemo = createMemo(() => current()?.key === "trading");
  const webmcpAttrs = createMemo(() => {
    const currentState = current();
    return currentState ? getWebMCPFormAttributes(currentState.spec) : {};
  });

  const renderDemoOptions = () => (
    <div class="w-[300px]">
      <SelectWrapper
        spec={{
          id: "demoSelect",
          kind: FieldKind.select,
          label: "Demo",
          placeholder: "Select demo",
          size: "sm",
          variant: "outlined",
          ringVariant: "scanner",
          options: [
            {label: "Demo 1: Contact Flow", value: "legacy"},
            {label: "Demo 2: Medical Intake", value: "medical"},
            {label: "Demo 3: Borrower Intake", value: "borrower"},
            {label: "Demo 4: Trading System", value: "trading"},
          ],
        }}
        field={demoSelectHandle}
        fullWidth={true}
      />
    </div>
  );

  const controlCheckboxClass =
    "h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400";

  const [darkMode, setDarkMode] = createSignal(false);

  return (
    <div class={cx("min-h-screen", darkMode() ? "dark" : "")}>
      <div class="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div class="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-500/10" />
          <div class="absolute right-10 top-0 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10" />
          <div class="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.06),_transparent_55%)]" />
        </div>

        <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
          <header class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Telepathic Form Demo
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">Spec-driven adaptive form flows</h1>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      webmcpActive()
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {webmcpActive() ? "✓ WebMCP Active" : "⏳ WebMCP: Chrome 146+"}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    ✓ AI Chatbot Ready
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <PlaygroundNav />
                <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Dark</span>
                  <input
                    type="checkbox"
                    class={controlCheckboxClass}
                    checked={darkMode()}
                    onInput={(event) => setDarkMode(event.currentTarget.checked)}
                  />
                </label>
              </div>
            </div>
            <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                This demo renders a form from `formSpec` and applies runtime trigger wiring for visibility,
                disabled state, and derived values. <strong class="text-emerald-600 dark:text-emerald-400">AI-ready</strong> via
                WebMCP.
              </p>
              <div class="justify-self-end">{renderDemoOptions()}</div>
            </div>
          </header>

          <main class="flex flex-col gap-6">
            <section
              class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50"
              {...webmcpAttrs()}
            >
              <h2 class="font-display text-lg font-semibold">Live form</h2>
              <div class="mt-6 flex flex-col gap-4">
                <Show when={current()}>
                  {(state) => (
                    <For each={state().sections}>
                      {(section) => (
                        <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
                          <div class="mb-4 flex items-center justify-between gap-2">
                            <h3 class="font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
                            <Show when={section.id === "prescriptions"}>
                              <Show when={isMedicalDemo()}>
                                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <span>Rows: {prescriptionRows()}</span>
                                  <button
                                    type="button"
                                    class="rounded-full border border-emerald-200/70 bg-white px-2.5 py-0.5 text-emerald-700 transition hover:bg-white disabled:opacity-40 dark:border-emerald-500/60 dark:bg-slate-900 dark:text-emerald-200"
                                    onClick={() =>
                                      setPrescriptionRows((count) => Math.min(count + 1, MAX_PRESCRIPTIONS))
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </Show>
                            </Show>
                            <Show when={section.id === "previous-addresses"}>
                              <Show when={isBorrowerDemo()}>
                                <div class="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <span>Rows: {previousAddressRows()}</span>
                                  <button
                                    type="button"
                                    class="rounded-full border border-rose-200/70 bg-white px-2.5 py-0.5 text-rose-700 transition hover:bg-white disabled:opacity-40 dark:border-rose-500/60 dark:bg-slate-900 dark:text-rose-200"
                                    disabled={previousAddressRows() <= 1}
                                    onClick={() => {
                                      const currentRows = previousAddressRows();
                                      if (currentRows <= 1) return;
                                      const confirmDelete = window.confirm(
                                        `Confirm deleting address #${currentRows}`,
                                      );
                                      if (confirmDelete) {
                                        setPreviousAddressRows((count) => Math.max(1, count - 1));
                                      }
                                    }}
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-full border border-emerald-200/70 bg-white px-2.5 py-0.5 text-emerald-700 transition hover:bg-white disabled:opacity-40 dark:border-emerald-500/60 dark:bg-slate-900 dark:text-emerald-200"
                                    onClick={() =>
                                      setPreviousAddressRows((count) => Math.min(count + 1, MAX_PREVIOUS_ADDRESSES))
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </Show>
                            </Show>
                            <Show when={section.id === "trading-system"}>
                              <Show when={isTradingDemo()}>
                                <div class="text-xs text-slate-500 dark:text-slate-400">
                                  Exchange: {tradingExchange() || "Not set"}
                                  <span class="mx-2">|</span>
                                  Market: {tradingMarket() || "Not set"}
                                </div>
                              </Show>
                            </Show>
                          </div>
                          <FormRenderer form={{id: state().spec.id, fields: section.fields}} handlesById={state().handlesById} />
                        </div>
                      )}
                    </For>
                  )}
                </Show>
              </div>
            </section>

            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
              <h2 class="font-display text-lg font-semibold">Runtime signals</h2>
              <div class="mt-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                <Show when={current()}>
                  {(state) => (
                    <>
                      <div>activeDemo = {state().label}</div>
                      <div>fieldCount = {state().spec.fields.length}</div>
                      <Show when={state().key === "medical"}>
                        <div>prescriptionRows = {prescriptionRows()}</div>
                      </Show>
                      <Show when={state().key === "borrower"}>
                        <div>previousAddressRows = {previousAddressRows()}</div>
                      </Show>
                      <Show when={state().key === "trading"}>
                        <div>tradingExchange = {tradingExchange() || "Not set"}</div>
                        <div>tradingMarket = {tradingMarket() || "Not set"}</div>
                      </Show>
                    </>
                  )}
                </Show>
              </div>
            </section>
          </main>
        </div>
      </div>

      <Show when={current()}>
        {(state) => <AIFormAssistant spec={state().spec} handlesById={state().handlesById} />}
      </Show>
    </div>
  );
};
