import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves conflicting Tailwind CSS classes.
 */
export function cx(...args: ClassValue[]): string {
  return twMerge(clsx(...args));
}

/**
 * Tremor Raw standard focus styles for form inputs
 */
export const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:ring-blue-100",
  // border color
  "focus:border-blue-600",
  "focus:outline-hidden",
];

/**
 * Tremor Raw standard keyboard focus ring
 */
export const focusRing = [
  "outline-hidden focus:outline-hidden",
  "focus-visible:ring-2",
  "focus-visible:ring-blue-600",
  "focus-visible:ring-offset-2",
];

/**
 * Tremor Raw standard error state styles for form inputs
 */
export const hasErrorInput = [
  "ring-2",
  "border-rose-500",
  "ring-rose-100",
];

/**
 * Formats a date into a clean UK/International string (e.g. "Oct 2026" or "14 Oct 2026")
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-GB", defaultOptions).format(d);
}

/**
 * Standard debounce utility for live auto-save and search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
