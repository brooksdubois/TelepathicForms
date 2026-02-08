import {createSignal, onCleanup} from "solid-js";
import type {Observable} from "rxjs";

export function fromObservable<T>(obs$: Observable<T>, initial: T): () => T {
  const [v, setV] = createSignal<T>(initial);
  const sub = obs$.subscribe(setV);
  onCleanup(() => sub.unsubscribe());
  return v;
}
