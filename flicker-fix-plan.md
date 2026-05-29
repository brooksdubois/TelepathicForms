# Trading Form Flicker Fix Plan

## Context

The trading system form flickers when selecting an Exchange before selecting a Market. A large set of fields appears briefly, then disappears. This was reproduced in Chrome with a frame-by-frame DOM probe against the Bun/Vite dev server.

Observed reproduction:

- Initial visible field slots before choosing an exchange:
  - `tradingExchange`
  - `tradingMarket`
- After selecting `CME`, the probe captured about 10 animation frames where all 51 trading fields were visible.
- The first bad sampled frame was about 37.6ms after the click.
- The extra fields were then removed through the field exit transition.

This is not a SolidJS state-management glitch and does not appear to be a browser-specific Chrome/Safari rendering issue. It is a deterministic runtime initialization/settling problem made visible by the transition layer.

## Root Cause

The current engine allows Solid to render a newly rebuilt graph before trigger-derived hidden state has settled.

Causal chain:

1. `TelepathicFormDemo.tsx` subscribes to `tradingExchange` and writes the value into a Solid signal.
2. The main demo `createEffect` depends on `tradingExchange()` and rebuilds the entire trading form graph when the exchange changes.
3. `TradingSystemFormSpec.ts` defines market-gated fields using triggers:
   - when `tradingMarket` is empty, hide/disable/clear the field.
   - when `tradingMarket` is non-empty, show/enable the field.
4. New `FieldRuntimeNode`s default hidden state to visible because `hiddenOverride$` starts as `null` and the hidden base defaults to false.
5. Trigger subscriptions enqueue the correct hidden patches, but `GraphRuntime.enqueuePatch()` defers `flushPatches()` with `queueMicrotask()`.
6. `FormRenderer` renders all fields from the spec immediately.
7. `FieldSlot` sees `hidden() === false` before trigger patches flush, so the fields mount.
8. The microtask flush then hides those fields.
9. `<Transition>` runs the exit animation, turning a short invalid state into a visible flicker.

Important related issue:

- `TradingSystemFormSpec.ts` uses `disabled: true` on some field specs.
- `FieldSpec` currently does not define field-level `disabled`.
- The runtime currently does not read field-level `disabled` or `hidden` base state when creating nodes.
- `bun run build` passes because Vite build does not type-check. `npx tsc --noEmit` reports the trading spec `disabled` errors, plus unrelated existing type errors elsewhere.

## Design Goal

Library-grade invariant:

> A field should never render from an unsettled graph state. Transitions should only animate real visibility changes after the graph reaches its correct state.

Do not fix this only in the trading form. The durable fix belongs in the engine.

Do not remove transitions. The transition system is doing what it was asked to do; the invalid initial visibility state is the real problem.

## Proposed Solution

### 1. Add First-Class Base Field State

Update `FieldSpec` in `src/engine/types.ts` to support:

```ts
disabled?: boolean;
hidden?: boolean;
```

Then update `createNodeFromSpec()` in `src/engine/generators.ts` so each `FieldRuntimeNode` receives base disabled/hidden values from the field spec.

Expected behavior:

- `spec.disabled` becomes the field's base disabled state.
- `spec.hidden` becomes the field's base hidden state.
- trigger overrides still take precedence when present.

### 2. Make `FieldRuntimeNode` Accept Base State

Update `FieldRuntimeNode` constructor args to include base disabled/hidden inputs, likely by using the existing `disabled$` and `hidden$` constructor hooks.

Current behavior:

- `disabledBase$` defaults to `new BehaviorSubject(false)`.
- `hiddenBase$` defaults to `new BehaviorSubject(false)`.

Desired behavior:

- `createNodeFromSpec()` passes `new BehaviorSubject(Boolean(spec.disabled))`.
- `createNodeFromSpec()` passes `new BehaviorSubject(Boolean(spec.hidden))`.

Keep override semantics:

```ts
override === null ? base : override
```

### 3. Add Synchronous Initial Graph Settling

Add a public method to `GraphRuntime`, for example:

```ts
settleInitialState(maxIterations = 25): void
```

This method should synchronously flush queued trigger patches after graph wiring and before `buildGraphFromFormSpec()` returns handles.

Important: this should settle to a fixed point, not just flush once.

Reason:

- trigger A may set a value.
- that value change may cause trigger B to enqueue a hidden/disabled patch.
- that patch may enqueue additional work.

A safe approach:

- expose a synchronous patch flush path.
- loop while pending patches exist.
- stop after `maxIterations`.
- if still pending after the guard, throw or warn with enough field IDs to diagnose circular trigger designs.

Keep live-update batching:

- construction-time settling should be synchronous.
- normal user interactions can continue using microtask batching.

### 4. Call Initial Settling Before Returning Handles

In `buildGraphFromFormSpec()`:

```ts
form.fields.forEach((f) => applyTriggersFromSpec(graph, f));
graph.settleInitialState();
```

This must happen before `handlesById` is returned to Solid.

Expected result:

- newly created handles expose already-settled `hidden$` and `disabled$` values.
- gated fields that should be hidden never mount on initial render.
- `<Transition>` has nothing invalid to animate out.

### 5. Keep Transitions

Keep `FieldSlot` transitions in `src/engine/fieldRendering.tsx`.

Primary fix should make this unnecessary, but optional hardening can be considered:

- suppress field enter/exit animation on first mount only.
- keep animation for real later visibility changes.

This should be treated as secondary hardening, not the root fix.

### 6. Longer-Term Improvement: Dynamic Options

The trading form currently rebuilds the entire graph so `tradingMarket` options can depend on `tradingExchange`.

This is valid but heavy. A more durable library feature would let options be derived without recreating the whole graph, for example:

```ts
optionsFrom?: {
  fieldId: string;
  map: Record<string, FieldOption[]>;
}
```

or a more general derived-options resolver.

This is not required to fix the flicker, but it would reduce graph churn and make dynamic forms more robust.

## Suggested Implementation Order

1. Add `disabled?: boolean` and `hidden?: boolean` to `FieldSpec`.
2. Update `createNodeFromSpec()` to pass field-level base disabled/hidden state into `FieldRuntimeNode`.
3. Add synchronous fixed-point settling to `GraphRuntime`.
4. Call graph settling in `buildGraphFromFormSpec()` after trigger wiring and before returning handles.
5. Add regression coverage for the trading case.
6. Re-run browser instrumentation to verify no hidden-gated fields ever become visible after selecting Exchange while Market is empty.
7. Optionally add first-mount transition hardening.
8. Later, design dynamic option sources to avoid full graph rebuilds for dependent selects.

## Verification Criteria

Manual/browser behavior:

- Open `/form-demo`.
- Select `Demo 4: Trading System`.
- Select an Exchange, such as `CME`, while Market is empty.
- Only `tradingExchange` and `tradingMarket` should be visible.
- No strategy/risk/order/routing/venue-specific fields should flash.
- After selecting a Market, the market-gated fields should enter normally with transitions.

Automated probe criteria:

- Sample `[data-field-slot-id]` visibility every animation frame around the exchange click.
- Before Market is selected, visible trading slots should remain limited to:
  - `tradingExchange`
  - `tradingMarket`
- Bad frame count should be 0.

Build/check commands:

```sh
bun run build
```

Known caveat:

- `npx tsc --noEmit` currently reports unrelated existing type errors in the repo. It also reports the current `disabled` field-spec issue, which this plan should address.

## Files To Inspect/Edit

- `src/engine/types.ts`
- `src/engine/FieldRuntimeNode.ts`
- `src/engine/GraphRuntime.ts`
- `src/engine/generators.ts`
- `src/engine/fieldRendering.tsx` only if adding optional first-mount transition hardening
- `src/form-demo/TradingSystemFormSpec.ts` for regression behavior, ideally without form-specific hacks
- relevant test/probe files if adding automated coverage

## Non-Goals

- Do not remove `<Transition>` globally.
- Do not solve this with a trading-form-only workaround.
- Do not abandon trigger-linked form elements.
- Do not assume this is a SolidJS state bug without fresh evidence.
- Do not rely on slower DOM rendering or timeouts to hide the issue.

