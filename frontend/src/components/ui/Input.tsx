import React from "react";
import { cx, focusInput, hasErrorInput } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  icon?: React.ElementType;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, icon: Icon, type = "text", ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cx(
            // base
            "w-full rounded-md border text-sm transition-all duration-100",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
            // border & padding
            "border-slate-300 dark:border-slate-800",
            Icon ? "pl-9 pr-3 py-2" : "px-3 py-2",
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
      </div>
    );
  }
);

Input.displayName = "Input";
