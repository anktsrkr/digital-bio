import React from "react";
import { cx } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) {
      return (
        <hr
          ref={ref as React.Ref<HTMLHRElement>}
          className={cx(
            "my-4 border-t border-slate-200 dark:border-slate-800",
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cx("relative my-4 flex items-center justify-center", className)}
        {...props}
      >
        <div
          className="absolute inset-0 flex items-center"
          aria-hidden="true"
        >
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400 font-medium">
            {children}
          </span>
        </div>
      </div>
    );
  }
);

Divider.displayName = "Divider";
