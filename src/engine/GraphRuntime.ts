import {distinctUntilChanged, type Observable, Subscription} from "rxjs";
import {FieldRuntimeNode, type NodePatch} from "./FieldRuntimeNode";

type NodeId = string;

export class GraphRuntime {
  private nodes = new Map<NodeId, FieldRuntimeNode<any>>();
  private subs = new Subscription();
  private pendingPatches = new Map<NodeId, NodePatch<any>>();
  private flushScheduled = false;

  hasNode(id: NodeId) {
    return this.nodes.has(id);
  }

  private enqueuePatch(targetId: NodeId, patch: NodePatch<any>) {
    const prev = this.pendingPatches.get(targetId) ?? {};
    this.pendingPatches.set(targetId, {...prev, ...patch});

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flushPatches());
    }
  }

  private flushPatches() {
    this.flushScheduled = false;

    if (this.pendingPatches.size === 0) return;

    const toApply = Array.from(this.pendingPatches.entries());
    this.pendingPatches.clear();

    toApply.forEach(([id, patch]) => {
      const node = this.nodes.get(id);
      if (!node) return;
      node.applyPatch(patch);
    });
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
