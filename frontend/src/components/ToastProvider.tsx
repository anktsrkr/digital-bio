"use client";

import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      richColors={false}
      toastOptions={{
        className:
          "border font-sans rounded-xl shadow-lg text-sm bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100",
        classNames: {
          title: "font-semibold text-sm",
          description: "text-xs text-slate-500 dark:text-slate-400",
          actionButton:
            "bg-blue-600 text-white hover:bg-blue-500 text-xs font-medium px-2.5 py-1.5 rounded-md",
          cancelButton:
            "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-md",
          error:
            "!border-rose-200 !bg-rose-50/80 !text-rose-800 dark:!border-rose-900/60 dark:!bg-rose-950/40 dark:!text-rose-200",
          success:
            "!border-emerald-200 !bg-emerald-50/80 !text-emerald-800 dark:!border-emerald-900/60 dark:!bg-emerald-950/40 dark:!text-emerald-200",
        },
      }}
    />
  );
}
