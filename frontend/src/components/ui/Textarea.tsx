import React from "react";
import { cx, focusInput, hasErrorInput } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cx(
          // base
          "w-full rounded-md border text-sm transition-all duration-100",
          "bg-white text-slate-900 placeholder:text-slate-400",
          "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
          // border & padding
          "border-slate-300 dark:border-slate-800 px-3 py-2 leading-relaxed",
          // focus styles
          ...focusInput,
          // error state
          hasError ? hasErrorInput : "",
          // disabled state
          "disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
