// src/components/AIFormAssistant.tsx
import {createSignal, createEffect, For, Show, type Component} from "solid-js";
import type {FormSpec, FieldHandle} from "../engine/types";
import {getGeminiFunctionDeclaration} from "../engine/webmcp";

type AIFormAssistantProps = {
  spec: FormSpec;
  handlesById: Map<string, FieldHandle>;
};

export const AIFormAssistant: Component<AIFormAssistantProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [messages, setMessages] = createSignal<{role: string; content: string}[]>([]);
  const [input, setInput] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  let messagesEndRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    messages();
    messagesEndRef?.scrollIntoView({behavior: "smooth"});
  });

  createEffect(() => {
    if (open()) setTimeout(() => inputRef?.focus(), 100);
  });

  async function send(text: string) {
    if (!text.trim() || loading()) return;
    setLoading(true);

    const newMsgs = [...messages(), {role: "user" as const, content: text}];
    setMessages(newMsgs);
    setInput("");

    try {
      const funcDecl = getGeminiFunctionDeclaration(props.spec);

      // Gather current form values for context
      const currentValues: Record<string, string> = {};
      for (const [id, handle] of props.handlesById) {
        const val = handle.value$.getValue();
        if (val) currentValues[id] = val;
      }

      // Build Gemini conversation history
      const geminiContents: any[] = [];

      // Add previous messages as conversation history
      for (const m of newMsgs) {
        geminiContents.push({
          role: m.role === "user" ? "user" : "model",
          parts: [{text: m.content}],
        });
      }

      // ── Gemini REST API call via Vite proxy ──
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          system_instruction: {
            parts: {
              text: `You are a form-filling assistant for Telepathic Forms. When the user describes information, ALWAYS use the ${funcDecl.name} function to populate form fields. Never just describe what you would fill — always call the function. Be concise. If ambiguous, make reasonable assumptions. Current form values: ${JSON.stringify(currentValues)}`,
            },
          },
          contents: geminiContents,
          tools: [
            {
              functionDeclarations: [funcDecl],
            },
          ],
          tool_config: {
            function_calling_config: {mode: "auto"},
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json();

      // ── Parse Gemini response ──
      let assistantText = "";
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      for (const part of parts) {
        // Text response
        if (part.text) {
          assistantText += part.text;
        }

        // Function call response
        if (part.functionCall) {
          const fnName = part.functionCall.name;
          const fnArgs = part.functionCall.args || {};

          if (fnName === funcDecl.name) {
            const filled: string[] = [];
            for (const [fieldId, value] of Object.entries(fnArgs as Record<string, any>)) {
              const handle = props.handlesById.get(fieldId);
              if (handle) {
                const strVal = Array.isArray(value) ? value.join(",") : String(value);
                handle.setValue(strVal);
                handle.markTouched();
                const fieldSpec = props.spec.fields.find((f) => f.id === fieldId);
                filled.push(fieldSpec?.label ?? fieldId);
              }
            }
            assistantText +=
              (assistantText ? "\n\n" : "") +
              `✅ Filled ${filled.length} fields: ${filled.join(", ")}`;
          }
        }
      }

      setMessages([...newMsgs, {role: "assistant", content: assistantText || "Done!"}]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          role: "assistant",
          content: `⚠️ ${err.message}\n\nMake sure:\n1. GEMINI_API_KEY is set in .env\n2. Get a free key at https://aistudio.google.com/apikey\n3. Restart Vite dev server after adding key`,
        },
      ]);
    }
    setLoading(false);
  }

  // ─── Preset prompts ─────────────────────────────────────────────────
  const presets = [
    {
      emoji: "📞",
      label: "Phone",
      prompt:
        "Set up John Smith for phone contact at 5552345678 with extension 1234, preferred morning calls, follow up on 2026-03-15. He's an employee with SSN 123456789 wanting $120000 salary with 28% tax. Interested in billing and security. Enable alerts. Notes: VIP client handle with care. Password: SecurePass2026!",
    },
    {
      emoji: "✉️",
      label: "Email",
      prompt:
        "Contact method email, sarah.chen@acme.com. Follow up 2026-04-01. Not an employee. Interested in roadmap and integrations. Alerts off. Notes: Potential enterprise customer.",
    },
    {
      emoji: "📮",
      label: "Mail",
      prompt:
        "Mail contact, ZIP 90210, follow up 2026-05-20. Employee, SSN 987654321, salary 85000, 22% tax. Interested in technical. Enable alerts.",
    },
  ];

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <button
        onClick={() => setOpen(!open())}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          height: open() ? "44px" : "48px",
          "min-width": open() ? "44px" : "auto",
          "padding-left": open() ? "0" : "16px",
          "padding-right": open() ? "0" : "16px",
          "border-radius": open() ? "12px" : "14px",
          border: open() ? "1px solid rgba(255,255,255,0.1)" : "none",
          background: open() ? "rgba(15,23,42,0.95)" : "linear-gradient(135deg, #22d3a7, #1a9e7f)",
          color: open() ? "rgba(255,255,255,0.6)" : "#fff",
          "font-size": open() ? "18px" : "14px",
          "font-weight": "600",
          cursor: "pointer",
          "z-index": "9999",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          gap: "8px",
          "box-shadow": open() ? "none" : "0 8px 32px rgba(34,211,167,0.3)",
          transition: "all 0.3s ease",
          "font-family": "'Inter', 'DM Sans', system-ui, sans-serif",
          "white-space": "nowrap",
          "letter-spacing": "0.01em",
        }}
      >
        {open() ? "✕" : "✦ AI Fill Form"}
      </button>

      {/* ─── Chat Panel ─── */}
      <Show when={open()}>
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "400px",
            "max-height": "75vh",
            background: "rgba(12,15,22,0.98)",
            "border-radius": "20px",
            border: "1px solid rgba(42,51,82,0.6)",
            "box-shadow": "0 20px 60px rgba(0,0,0,0.6)",
            "z-index": "9998",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "backdrop-filter": "blur(20px)",
            "font-family": "'Inter', 'DM Sans', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              "border-bottom": "1px solid rgba(42,51,82,0.6)",
              background: "linear-gradient(135deg, rgba(34,211,167,0.08), transparent)",
            }}
          >
            <div style={{"font-size": "14px", "font-weight": "600", color: "#e2e8f0"}}>
              ✦ AI Form Assistant
            </div>
            <div style={{"font-size": "11px", color: "#5a6478", "margin-top": "2px"}}>
              Describe what to fill — AI handles the rest
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: "1",
              overflow: "auto",
              padding: "16px",
              display: "flex",
              "flex-direction": "column",
              gap: "12px",
              "min-height": "180px",
              "max-height": "400px",
            }}
          >
            <Show when={messages().length === 0}>
              <div
                style={{
                  "text-align": "center",
                  padding: "24px 16px",
                  color: "#5a6478",
                  "font-size": "13px",
                  "line-height": "1.6",
                }}
              >
                <div style={{"font-size": "28px", "margin-bottom": "8px"}}>💬</div>
                <div>Try: "Phone contact for John at 5551234567, morning preferred, follow up March 15th"</div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    "justify-content": "center",
                    "margin-top": "16px",
                    "flex-wrap": "wrap",
                  }}
                >
                  <For each={presets}>
                    {(p) => (
                      <button
                        onClick={() => send(p.prompt)}
                        disabled={loading()}
                        style={{
                          padding: "6px 12px",
                          "border-radius": "8px",
                          border: "1px solid rgba(42,51,82,0.6)",
                          background: "rgba(17,21,32,0.8)",
                          color: "#8892a8",
                          "font-size": "11px",
                          "font-weight": "500",
                          cursor: loading() ? "not-allowed" : "pointer",
                          "font-family": "inherit",
                          opacity: loading() ? "0.5" : "1",
                        }}
                      >
                        {p.emoji} {p.label}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <For each={messages()}>
              {(m) => (
                <div style={{display: "flex", "justify-content": m.role === "user" ? "flex-end" : "flex-start"}}>
                  <div
                    style={{
                      "max-width": "85%",
                      padding: "10px 14px",
                      "border-radius": m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: m.role === "user" ? "rgba(34,211,167,0.12)" : "rgba(17,21,32,0.8)",
                      border: `1px solid ${m.role === "user" ? "rgba(26,158,127,0.3)" : "rgba(42,51,82,0.6)"}`,
                      "font-size": "13px",
                      "line-height": "1.5",
                      color: "#e2e8f0",
                      "white-space": "pre-wrap",
                      "word-break": "break-word",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              )}
            </For>

            <Show when={loading()}>
              <div style={{display: "flex", gap: "6px", padding: "8px 0", "align-items": "center"}}>
                <div style={{width: "8px", height: "8px", "border-radius": "4px", background: "#22d3a7", animation: "telepathic-pulse 1s ease infinite 0s"}} />
                <div style={{width: "8px", height: "8px", "border-radius": "4px", background: "#22d3a7", animation: "telepathic-pulse 1s ease infinite 0.15s"}} />
                <div style={{width: "8px", height: "8px", "border-radius": "4px", background: "#22d3a7", animation: "telepathic-pulse 1s ease infinite 0.3s"}} />
                <span style={{"font-size": "11px", color: "#5a6478", "margin-left": "8px"}}>AI is thinking...</span>
              </div>
            </Show>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              "border-top": "1px solid rgba(42,51,82,0.6)",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input().trim() && !loading()) send(input().trim());
              }}
              placeholder="Describe what to fill..."
              style={{
                flex: "1",
                padding: "10px 14px",
                "border-radius": "10px",
                border: "1px solid rgba(42,51,82,0.6)",
                background: "rgba(17,21,32,0.8)",
                color: "#e2e8f0",
                "font-size": "13px",
                outline: "none",
                "font-family": "inherit",
              }}
            />
            <button
              onClick={() => {
                if (input().trim() && !loading()) send(input().trim());
              }}
              disabled={loading() || !input().trim()}
              style={{
                padding: "10px 16px",
                "border-radius": "10px",
                border: "none",
                background: loading() || !input().trim() ? "rgba(17,21,32,0.8)" : "#22d3a7",
                color: loading() || !input().trim() ? "#5a6478" : "#000",
                "font-size": "13px",
                "font-weight": "600",
                cursor: loading() || !input().trim() ? "not-allowed" : "pointer",
                "font-family": "inherit",
                transition: "all 0.2s",
              }}
            >
              {loading() ? "···" : "→"}
            </button>
          </div>
        </div>
      </Show>

      <style>{`
        @keyframes telepathic-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};