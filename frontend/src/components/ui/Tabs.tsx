import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx, focusRing } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "line" | "solid";
  }
>(({ className, variant = "line", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cx(
      "inline-flex items-center justify-start",
      variant === "line" &&
        "w-full border-b border-slate-200 dark:border-slate-800 gap-x-6",
      variant === "solid" &&
        "rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400 gap-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "line" | "solid";
  }
>(({ className, variant = "line", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cx(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
      ...focusRing,
      variant === "line" && [
        "-mb-px border-b-2 border-transparent py-2.5 text-slate-600 hover:text-slate-900",
        "data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-semibold",
        "dark:text-slate-400 dark:hover:text-slate-200 dark:data-[state=active]:border-blue-500 dark:data-[state=active]:text-blue-400",
      ],
      variant === "solid" && [
        "rounded-md px-3 py-1.5 text-slate-600 dark:text-slate-400",
        "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xs font-semibold",
        "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100",
      ],
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cx(
      "mt-3 focus-visible:outline-hidden",
      ...focusRing,
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
