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

/** ---------------------------------------------
 * Demo App: Spec-driven version
 * --------------------------------------------- */
export const TelepathicFormDemo: Component = () => {
  // This is the JS object that "draws" the form.
  // In the real system, Kotlin would output/compile something like this.
  const formSpec: FormSpec = {
    id: "demo",
    fields: [
      {
        id: "contactMethod",
        kind: FieldKind.select,
        row: 1,
        label: "Preferred Contact Method",
        placeholder: "Select one...",
        size: "lg",
        variant: "outlined",
        startAdornment: "Method",
        ringEnabled: true,
        animateRingOnFocus: true,
        required: true,
        options: [
          {label: "Phone", value: "phone"},
          {label: "Email", value: "email"},
          {label: "Mail", value: "mail"},
        ],
        triggers: [
          // INITIAL: nothing selected -> hide everything except the selectors
          {
            when: WhenOperators.isEmpty,
            operations: [
              {fieldIds: ["phone", "hasExtension", "ext", "email", "zip", "preferredTime", "followUpDate", "notes", "password"], operator: TriggerOperators.setHidden, value: true},
              // keep these disabled/cleared as a safety baseline
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },

          // PHONE: show phone-related fields; hide email/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "phone"},
            operations: [
              {fieldIds: ["phone", "hasExtension", "preferredTime", "followUpDate", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["email", "zip"], operator: TriggerOperators.setHidden, value: true},
              // ext is controlled by its own triggers; default hidden until its triggers show it
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: false},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // EMAIL: show email; hide phone/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "email"},
            operations: [
              {fieldIds: ["email", "followUpDate", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "zip", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // MAIL: show zip; hide phone/email fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "mail"},
            operations: [
              {fieldIds: ["zip", "followUpDate", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "email", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // NOT PHONE: disable + clear phone and extension controls
          {
            when: {operator: WhenOperators.notEquals, value: "phone"},
            operations: [
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // NOT MAIL: disable + clear zip
          {
            when: {operator: WhenOperators.notEquals, value: "mail"},
            operations: [
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "phone",
        kind: FieldKind.phone,
        row: 2,
        label: "Phone (required for phone contact)",
        placeholder: "(___) ___-____",
        inputMask: "(___) ___-____",
        inputBlocker: "^\\d{0,10}$",
        size: "md",
        variant: "outlined",
        startAdornment: "US",
        endAdornment: "10 digits",
        ringEnabled: true,
        animateRingOnFocus: true,
        required: true,
        helperText: "Digits are stored; formatting is view-only.",
      },
      {
        id: "hasExtension",
        kind: FieldKind.inlineCheckbox,
        row: 2,
        label: "Has extension",
        helperText: "Enable the extension field.",
      },
      {
        id: "ext",
        kind: FieldKind.number,
        row: 2,
        label: "Extension",
        helperText: "Optional. Digits only, max 6.",
        placeholder: "000000",
        maxDigits: 6,
        size: "sm",
        variant: "standard",
        ringEnabled: true,
        animateRingOnFocus: true,
        validate: (v) => {
          if (!v) return []; // optional
          if (!/^\d{1,6}$/.test(v)) return ["Ext must be 1–6 digits."];
          return [];
        },
        triggers: [
          // Show/hide purely based on the checkbox
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setHidden,
              value: false,
            },
          },
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setHidden,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },

          // Enable only when phone is valid AND the checkbox is on
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isValid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setDisabled,
              value: false,
            },
          },

          // If phone becomes invalid while shown, disable + clear (but keep visibility)
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isInvalid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },
        ],
      },
      {
        id: "email",
        kind: FieldKind.text,
        row: 4,
        label: "Email",
        placeholder: "you@example.com",
        helperText: "Used when contact method is email.",
        type: "email",
        autoComplete: "email",
        minLength: 6,
        maxLength: 120,
        size: "lg",
        variant: "filled",
        startAdornment: "@",
        endAdornment: "required for email",
        ringEnabled: true,
        animateRingOnFocus: true,
        validate: (v) => {
          if (!v) return [];
          if (!/^[^@]+@[^@]+\.[^@]+$/.test(v)) return ["Enter a valid email."];
          return [];
        },
      },
      {
        id: "preferredTime",
        kind: FieldKind.inlineRadio,
        row: 1,
        label: "Preferred Time",
        required: true,
        variant: "filled",
        size: "md",
        inline: true,
        ringEnabled: true,
        options: [
          {label: "Morning", value: "morning", helperText: "8am-12pm"},
          {label: "Afternoon", value: "afternoon", helperText: "12pm-5pm"},
          {label: "Evening", value: "evening", helperText: "5pm-8pm"},
        ],
        helperText: "Used for phone follow-ups.",
      },
      {
        id: "zip",
        kind: FieldKind.zip,
        label: "ZIP Code",
        inputMask: "00000[-0000]",
        inputBlocker: "^\\d{0,9}$",
        size: "md",
        variant: "outlined",
        startAdornment: "US",
        ringEnabled: true,
        animateRingOnFocus: true,
        required: true,
        helperText: "Required only for mail contact.",
      },
      {
        id: "followUpDate",
        kind: FieldKind.date,
        row: 4,
        label: "Preferred follow-up date",
        placeholder: "MM-DD-YYYY",
        helperText: "Choose when we should follow up.",
        inputMask: "MM-DD-YYYY",
        clearable: true,
        disablePast: true,
        openOnFocus: true,
        closeOnSelect: true,
        size: "md",
        variant: "outlined",
        ringEnabled: true,
        animateRingOnFocus: true,
      },
      {
        id: "isEmployee",
        kind: FieldKind.checkbox,
        row: 1,
        label: "I am an employee",
        helperText: "Employee-only SSN field will unlock.",
        variant: "outlined",
        size: "md",
        ringEnabled: true,
        animateRingOnFocus: true,
        triggers: [
          {
            when: {operator: WhenOperators.equals, value: "true"},
            operations: [
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },
          {
            when: {operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ssn", "salary", "taxPercent"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "alertsEnabled",
        kind: FieldKind.switch,
        row: 5,
        label: "Enable Product Alerts",
        helperText: "Demonstrates the Switch primitive wrapper.",
        variant: "filled",
        size: "md",
        ringEnabled: true,
        animateRingOnFocus: true,
      },
      {
        id: "interests",
        kind: FieldKind.multiSelect,
        row: 5,
        label: "Interest Areas",
        placeholder: "Pick one or more",
        helperText: "Demonstrates grouped options, search, clear, and maxSelected.",
        searchable: true,
        clearable: true,
        maxSelected: 3,
        variant: "outlined",
        size: "md",
        options: [
          {label: "Billing", value: "billing", group: "Support"},
          {label: "Technical", value: "technical", group: "Support"},
          {label: "Roadmap", value: "roadmap", group: "Product"},
          {label: "Integrations", value: "integrations", group: "Product"},
          {label: "Security", value: "security", group: "Platform"},
        ],
      },
      {
        id: "ssn",
        kind: FieldKind.ssn,
        label: "SSN (optional)",
        inputMask: "___-__-____",
        inputBlocker: "^\\d{0,9}$",
        size: "md",
        variant: "filled",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "Digits only. Stored as raw digits.",
      },
      {
        id: "salary",
        kind: FieldKind.currency,
        row: 3,
        label: "Desired Salary",
        placeholder: "0.00",
        size: "lg",
        variant: "filled",
        startAdornment: "$",
        endAdornment: "USD",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "Six figures max",
      },
      {
        id: "taxPercent",
        kind: FieldKind.percent,
        row: 3,
        label: "Estimated taxation",
        placeholder: "0.00",
        size: "lg",
        variant: "outlined",
        endAdornment: "%",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "How much you will expect to be taxed",
      },
      {
        id: "notes",
        kind: FieldKind.textArea,
        row: 4,
        label: "Notes",
        placeholder: "Anything else we should know?",
        helperText: "Up to 240 chars.",
        size: "md",
        variant: "outlined",
        rows: 4,
        autosize: true,
        minRows: 3,
        maxRows: 7,
        ringEnabled: true,
        animateRingOnFocus: true,
        validate: (v) => (v.length > 240 ? ["Max 240 chars."] : []),
      },
      {
        id: "password",
        kind: FieldKind.password,
        label: "Account Password",
        placeholder: "••••••••",
        autoComplete: "new-password",
        minLength: 8,
        maxLength: 128,
        size: "md",
        variant: "filled",
        ringEnabled: true,
        animateRingOnFocus: true,
        helperText: "Toggle show/hide (no masking rules enforced).",
      },
    ],
  };

  const {graph, nodesById, handlesById} = buildGraphFromFormSpec(formSpec);
  onCleanup(() => graph.destroy());

  // ── NEW: Register as WebMCP tool on mount ──
  const [webmcpActive, setWebmcpActive] = createSignal(false);
  onMount(() => {
    const registered = registerWebMCPTool(formSpec, handlesById);
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
  const webmcpAttrs = getWebMCPFormAttributes(formSpec);

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
                <FormRenderer form={formSpec} handlesById={handlesById} />
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
      <AIFormAssistant spec={formSpec} handlesById={handlesById} />
    </div>
  );
};