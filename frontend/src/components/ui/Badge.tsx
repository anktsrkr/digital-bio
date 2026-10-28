import React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cx } from "@/lib/utils";

export const badgeVariants = tv({
  base: "inline-flex items-center justify-center font-medium transition-colors select-none",
  variants: {
    variant: {
      neutral: [
        "bg-slate-100 text-slate-700 border border-slate-200/80",
        "dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60",
      ],
      success: [
        "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
        "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      ],
      error: [
        "bg-rose-50 text-rose-700 border border-rose-200/80",
        "dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      ],
      warning: [
        "bg-amber-50 text-amber-700 border border-amber-200/80",
        "dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      ],
      blue: [
        "bg-blue-50 text-blue-700 border border-blue-200/80",
        "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
      ],
      classic: [
        "bg-zinc-100 text-zinc-900 border border-zinc-300 font-semibold",
        "dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
      ],
      navy: [
        "bg-sky-50 text-sky-900 border border-sky-300/80 font-semibold",
        "dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
      ],
      teal: [
        "bg-teal-50 text-teal-900 border border-teal-300/80 font-semibold",
        "dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800",
      ],
      amber: [
        "bg-amber-50 text-amber-800 border border-amber-300 font-semibold",
        "dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700",
      ],
    },
    size: {
      sm: "text-[11px] px-2 py-0.5 rounded-md gap-1",
      md: "text-xs px-2.5 py-1 rounded-md gap-1.5",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ElementType;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon: Icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cx(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
