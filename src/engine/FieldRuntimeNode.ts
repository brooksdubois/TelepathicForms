import {BehaviorSubject, combineLatest, distinctUntilChanged, map, type Observable} from "rxjs";
import type {Validator, ValidationContext} from "./types";

export type NodePatch<T> = {
  value?: T;
  disabledOverride?: boolean | null;
  hiddenOverride?: boolean | null;
};

export class FieldRuntimeNode<T> {
  readonly id: string;
  readonly value$: BehaviorSubject<T>;
  readonly touched$ = new BehaviorSubject<boolean>(false);
  readonly focused$ = new BehaviorSubject<boolean>(false);

  readonly errors$: Observable<string[]>;
  readonly valid$: Observable<boolean>;

  private readonly disabledOverride$ = new BehaviorSubject<boolean | null>(null);
  readonly disabled$: Observable<boolean>;

  private readonly hiddenOverride$ = new BehaviorSubject<boolean | null>(null);
  readonly hidden$: Observable<boolean>;

  constructor(args: {
    id: string;
    initialValue: T;
    validate?: Validator<T>;
    disabled$?: Observable<boolean>;
    hidden$?: Observable<boolean>;
    validateDeps$?: Array<Observable<unknown>>;
    validationContext?: ValidationContext;
  }) {
    this.id = args.id;
    this.value$ = new BehaviorSubject<T>(args.initialValue);

    const validate = args.validate ?? (() => []);
    const validationContext = args.validationContext ?? {getValue: () => ""};
    const value$ = this.value$ as Observable<unknown>;
    const sources = args.validateDeps$?.length
      ? combineLatest([value$, ...args.validateDeps$])
      : value$;

    this.errors$ = sources.pipe(
      map((valueOrValues) => {
        const value =
          Array.isArray(valueOrValues) ? (valueOrValues[0] as T) : (valueOrValues as T);
        return validate(value, validationContext);
      }),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );

    this.valid$ = this.errors$.pipe(
      map((errs) => errs.length === 0),
      distinctUntilChanged()
    );

    const disabledBase$ = args.disabled$ ?? new BehaviorSubject(false);
    this.disabled$ = combineLatest([disabledBase$, this.disabledOverride$]).pipe(
      map(([base, override]) => (override === null ? base : override)),
      distinctUntilChanged()
    );

    const hiddenBase$ = args.hidden$ ?? new BehaviorSubject(false);
    this.hidden$ = combineLatest([hiddenBase$, this.hiddenOverride$]).pipe(
      map(([base, override]) => (override === null ? base : override)),
      distinctUntilChanged()
    );
  }

  setValue(next: T) {
    this.value$.next(next);
  }

  markTouched() {
    this.touched$.next(true);
  }

  setFocused(isFocused: boolean) {
    this.focused$.next(isFocused);
  }

  setDisabledOverride(next: boolean | null) {
    this.disabledOverride$.next(next);
  }

  setHiddenOverride(next: boolean | null) {
    this.hiddenOverride$.next(next);
  }

  applyPatch(patch: NodePatch<T>) {
    if (Object.prototype.hasOwnProperty.call(patch, "value")) {
      this.setValue(patch.value as T);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "disabledOverride")) {
      this.setDisabledOverride(patch.disabledOverride as boolean | null);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "hiddenOverride")) {
      this.setHiddenOverride(patch.hiddenOverride as boolean | null);
    }
  }
}
