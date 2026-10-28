"use client";

import { SignIn } from "@clerk/react";

export function SignInClient() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md flex flex-col items-center">
        <SignIn
          appearance={{
            elements: {
              card: "shadow-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl",
              headerTitle: "text-slate-900 dark:text-slate-100 font-semibold",
              headerSubtitle: "text-slate-500 dark:text-slate-400",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs text-sm normal-case",
              formFieldInput:
                "border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 rounded-md focus:border-blue-600 focus:ring-blue-100",
              footerActionLink: "text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium",
            },
          }}
          routing="hash"
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={`${basePath}/`}
        />
      </div>
    </div>
  );
}
