import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";
import { cx, focusRing } from "@/lib/utils";

export const buttonVariants = tv({
  base: [
    "relative inline-flex items-center justify-center whitespace-nowrap text-center font-medium transition-all duration-100 ease-in-out cursor-pointer",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed select-none",
    ...focusRing,
  ],
  variants: {
    variant: {
      primary: [
        "bg-blue-600 text-white shadow-xs hover:bg-blue-500 active:bg-blue-700",
        "dark:bg-blue-600 dark:hover:bg-blue-500 dark:active:bg-blue-700",
      ],
      secondary: [
        "bg-white text-slate-900 border border-slate-200/80 shadow-xs hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100",
        "dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/80 dark:active:bg-slate-800",
      ],
      light: [
        "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/60",
        "dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:active:bg-slate-800/80",
      ],
      destructive: [
        "bg-rose-600 text-white shadow-xs hover:bg-rose-500 active:bg-rose-700",
        "dark:bg-rose-600 dark:hover:bg-rose-500 dark:active:bg-rose-700",
      ],
      ghostDestructive: [
        "bg-transparent text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100",
        "dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300",
      ],
    },
    size: {
      xs: "text-xs px-2 py-1 gap-1 rounded-md",
      sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-md",
      md: "text-sm px-3.5 py-2 gap-2 rounded-lg",
      lg: "text-base px-4 py-2.5 gap-2.5 rounded-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      icon: Icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cx(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText || children}
          </span>
        ) : (
          <>
            {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
