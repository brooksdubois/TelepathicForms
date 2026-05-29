import {distinctUntilChanged, type Observable, Subscription} from "rxjs";
import {FieldRuntimeNode, type NodePatch} from "./FieldRuntimeNode";

type NodeId = string;

export class GraphRuntime {
  private nodes = new Map<NodeId, FieldRuntimeNode<any>>();
  private subs = new Subscription();
  private pendingPatches = new Map<NodeId, NodePatch<any>>();
  private flushScheduled = false;
  private isSettling = false;

  hasNode(id: NodeId) {
    return this.nodes.has(id);
  }

  private enqueuePatch(targetId: NodeId, patch: NodePatch<any>) {
    const prev = this.pendingPatches.get(targetId) ?? {};
    this.pendingPatches.set(targetId, {...prev, ...patch});

    if (!this.isSettling && !this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flushPatches());
    }
  }

  private flushPendingPatches() {
    if (this.pendingPatches.size === 0) return;

    const toApply = Array.from(this.pendingPatches.entries());
    this.pendingPatches.clear();

    toApply.forEach(([id, patch]) => {
      const node = this.nodes.get(id);
      if (!node) return;
      node.applyPatch(patch);
    });
  }

  private flushPatches() {
    this.flushScheduled = false;
    this.flushPendingPatches();
  }

  settleInitialState(maxIterations = 25) {
    this.isSettling = true;
    this.flushScheduled = false;

    try {
      let iterations = 0;

      while (this.pendingPatches.size > 0) {
        if (iterations >= maxIterations) {
          const pendingIds = Array.from(this.pendingPatches.keys()).join(", ");
          throw new Error(
            `Graph trigger settling exceeded ${maxIterations} iterations. Pending fields: ${pendingIds}`,
          );
        }

        iterations += 1;
        this.flushPendingPatches();
      }
    } finally {
      this.isSettling = false;
      this.flushScheduled = false;
    }
  }

  register<T>(node: FieldRuntimeNode<T>) {
    if (this.nodes.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
    this.nodes.set(node.id, node);
    return node;
  }

  get<T>(id: NodeId): FieldRuntimeNode<T> {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`Missing node: ${id}`);
    return n as FieldRuntimeNode<T>;
  }

  wireDisabledWhen(targetId: NodeId, pred$: Observable<boolean>, disabled: boolean) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {disabledOverride: disabled});
      })
    );
  }

  wireHiddenWhen(targetId: NodeId, pred$: Observable<boolean>, hidden: boolean) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {hiddenOverride: hidden});
      })
    );
  }

  wireValueWhen(targetId: NodeId, pred$: Observable<boolean>, value: any) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {value});
      })
    );
  }

  destroy() {
    this.flushPatches();
    this.subs.unsubscribe();
    this.nodes.forEach((n) => {
      n.value$.complete();
      n.touched$.complete();
      n.focused$.complete();
    });
    this.nodes.clear();
  }
}
