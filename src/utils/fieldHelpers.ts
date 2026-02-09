import type {Formatter, Normalizer, Validator} from "../engine/types";

export const normalizePhone: Normalizer = (raw) => {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
};

export const phoneDigitsBlocker = /^\d{0,10}$/;

export const normalizeDigits = (raw: string, maxDigits: number) =>
  raw.replace(/\D/g, "").slice(0, maxDigits);

export function normalizeDecimalInput(
  raw: string,
  maxIntDigits: number,
  maxFracDigits: number | null
): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  let out = "";
  let seenDot = false;
  for (const ch of cleaned) {
    if (ch === ".") {
      if (seenDot) continue;
      seenDot = true;
      out += ".";
      continue;
    }
    out += ch;
  }

  let intPart = out;
  let fracPart = "";
  if (seenDot) {
    const idx = out.indexOf(".");
    intPart = out.slice(0, idx);
    fracPart = out.slice(idx + 1);
  }

  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (intPart.length > maxIntDigits) intPart = intPart.slice(0, maxIntDigits);
  if (maxFracDigits !== null) fracPart = fracPart.slice(0, maxFracDigits);

  if (intPart === "" && fracPart === "") return "";
  if (intPart === "" && fracPart !== "") intPart = "0";

  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

const addCommas = (intPart: string) =>
  intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const formatCurrencyDisplay = (n: string): string => {
  if (!n) return "";
  const [intRaw, fracRaw = ""] = n.split(".");
  const intWithCommas = addCommas(intRaw || "0");
  const frac2 = (fracRaw + "00").slice(0, 2);
  return `$${intWithCommas}.${frac2}`;
};

export const roundDecimalHalfEven = (raw: string, scale: number): string => {
  if (!raw) return "";

  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  let out = "";
  let seenDot = false;
  for (const ch of cleaned) {
    if (ch === ".") {
      if (seenDot) continue;
      seenDot = true;
      out += ".";
      continue;
    }
    out += ch;
  }

  let [intPart, fracPart = ""] = out.split(".");
  intPart = (intPart || "0").replace(/^0+(?=\d)/, "");

  const frac = fracPart.padEnd(scale + 2, "0");
  const keep = frac.slice(0, scale);
  const next = frac.charCodeAt(scale) - 48;
  const rest = frac.slice(scale + 1);

  let roundUp = false;
  if (next > 5) roundUp = true;
  else if (next < 5) roundUp = false;
  else {
    const hasNonZeroAfter = /[1-9]/.test(rest);
    if (hasNonZeroAfter) {
      roundUp = true;
    } else {
      const lastDigit =
        scale === 0
          ? intPart.charCodeAt(intPart.length - 1) - 48
          : keep.charCodeAt(keep.length - 1) - 48;
      roundUp = (lastDigit % 2) === 1;
    }
  }

  const baseDigits = (intPart + keep.padEnd(scale, "0")) || "0";

  if (!roundUp) {
    if (scale === 0) return intPart;
    return `${intPart}.${keep.padEnd(scale, "0")}`;
  }

  const arr = baseDigits.split("").map((c) => c.charCodeAt(0) - 48);
  let i = arr.length - 1;
  arr[i] += 1;
  while (i > 0 && arr[i] === 10) {
    arr[i] = 0;
    i -= 1;
    arr[i] += 1;
  }
  if (arr[0] === 10) {
    arr[0] = 0;
    arr.unshift(1);
  }

  const rounded = arr.join("");
  const intLen = rounded.length - scale;
  const intOut = rounded.slice(0, intLen) || "0";
  if (scale === 0) return intOut;
  const fracOut = rounded.slice(intLen).padStart(scale, "0");
  return `${intOut}.${fracOut}`;
};

export const formatPercentDisplay = (n: string): string => {
  if (!n) return "";
  const [intRaw, fracRaw = ""] = n.split(".");
  const intWithCommas = addCommas(intRaw || "0");
  if (fracRaw) return `${intWithCommas}.${fracRaw}%`;
  return `${intWithCommas}%`;
};

export const formatSSN: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  const a = d.slice(0, 3);
  const b = d.slice(3, 5);
  const c = d.slice(5, 9);
  if (d.length <= 3) return a;
  if (d.length <= 5) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
};

export const formatZip: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 9)}`;
};

function isControlKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  return (
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Tab" ||
    e.key === "Enter" ||
    e.key === "Escape" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Home" ||
    e.key === "End"
  );
}

export function blockNonDigitsAndMaxLen(e: KeyboardEvent, currentDigits: string, maxLen: number) {
  if (isControlKey(e)) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (currentDigits.length >= maxLen) {
    e.preventDefault();
  }
}

export function blockNonDecimalInput(e: KeyboardEvent, currentValue: string) {
  if (isControlKey(e)) return;
  if (/^\d$/.test(e.key)) return;
  if (e.key === "." && !currentValue.includes(".")) return;
  e.preventDefault();
}

export const formatPhone: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
};

export const validatePhone: Validator<string> = (digits) => {
  if (!digits) return ["Phone is required."];
  if (!/^\d{10}$/.test(digits)) return ["Phone must be 10 digits."];
  return [];
};

export const makeSsnValidator = (required: boolean): Validator<string> => (digits) => {
  if (!digits) return required ? ["SSN is required."] : [];
  if (!/^\d{9}$/.test(digits)) return ["SSN must be 9 digits."];
  return [];
};

export const makeZipValidator = (required: boolean): Validator<string> => (digits) => {
  if (!digits) return required ? ["ZIP is required."] : [];
  if (!/^\d{5}(\d{4})?$/.test(digits)) return ["ZIP must be 5 or 9 digits."];
  return [];
};
