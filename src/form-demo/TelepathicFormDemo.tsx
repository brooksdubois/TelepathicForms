import {createSignal, onCleanup, onMount, type Component} from "solid-js";
import {
  buildGraphFromFormSpec,
  FieldKind,
  FormRenderer,
  OperatorMaths,
  TriggerOperators,
  WhenOperators,
  type FormSpec,
} from "../engine/generators";
import {registerWebMCPTool, getWebMCPFormAttributes} from "../engine/webmcp";
import {AIFormAssistant} from "../components/AIFormAssistant";
import PlaygroundNav from "../playgrounds/PlaygroundNav";
import {cx} from "../utils/cx";
import {fromObservable} from "../utils/fromObservable";
import {demoFormSpec} from "./DemoFormSpec";

/** ---------------------------------------------
 * Demo App: Spec-driven version
 * --------------------------------------------- */


export const TelepathicFormDemo: Component = () => {
  // This is the JS object that "draws" the form.
  // In the real system, Kotlin would output/compile something like this.

  const {graph, nodesById, handlesById} = buildGraphFromFormSpec(demoFormSpec);
  onCleanup(() => graph.destroy());

  // ── NEW: Register as WebMCP tool on mount ──
  const [webmcpActive, setWebmcpActive] = createSignal(false);
  onMount(() => {
    const registered = registerWebMCPTool(demoFormSpec, handlesById);
    setWebmcpActive(registered);
  });

  // debug readouts
  const contactMethod = fromObservable(nodesById.get("contactMethod")!.value$, "");
  const phoneValid = fromObservable(nodesById.get("phone")!.valid$, false);
  const extDisabled = fromObservable(nodesById.get("ext")!.disabled$, false);
  const zipDisabled = fromObservable(nodesById.get("zip")!.disabled$, false);
  const [darkMode, setDarkMode] = createSignal(false);

  const controlCheckboxClass =
    "h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400";

  // Get WebMCP declarative attributes for the form wrapper
  const webmcpAttrs = getWebMCPFormAttributes(demoFormSpec);

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
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Spec-driven adaptive form flows
                </h1>
                {/* ── NEW: AI-Ready badges ── */}
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${webmcpActive() ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                    {webmcpActive() ? "✓ WebMCP Active" : "⏳ WebMCP: Chrome 146+"}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    ✓ AI Chatbot Ready
                  </span>
                </div>
              </div>
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
            <PlaygroundNav currentPath="/form-demo" />
            <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              This demo renders a form from `formSpec` and applies runtime trigger wiring for
              visibility, disabled state, and derived values. <strong class="text-emerald-600 dark:text-emerald-400">AI-ready</strong> via WebMCP + embedded Claude chatbot (🤖 bottom-right).
            </p>
          </header>

          <main class="flex flex-col gap-6">
            <section
              class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50"
              {...webmcpAttrs}
            >
              <h2 class="font-display text-lg font-semibold">Live form</h2>
              <div class="mt-6">
                <FormRenderer form={demoFormSpec} handlesById={handlesById} />
              </div>
            </section>

            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
              <h2 class="font-display text-lg font-semibold">Runtime signals</h2>
              <div class="mt-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                <div>phone.valid = {String(phoneValid())}</div>
                <div>ext.disabled (wired) = {String(extDisabled())}</div>
                <div>zip.disabled (wired) = {String(zipDisabled())}</div>
                <div>contactMethod = {contactMethod() || "(empty)"}</div>
                <div>webmcp.registered = {String(webmcpActive())}</div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* ── NEW: AI Form Assistant chatbot ── */}
      <AIFormAssistant spec={demoFormSpec} handlesById={handlesById} />
    </div>
  );
};