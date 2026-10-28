"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/react";
import { RiLockPasswordLine, RiLoginBoxLine } from "@remixicon/react";
import { Button } from "@/components/ui/Button";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  // Allow public access to sign-in and sign-up pages
  const isAuthRoute =
    pathname?.includes("/sign-in") || pathname?.includes("/sign-up");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Session loading indicator
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in: gate access completely
  if (!isSignedIn) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-lg">
          <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <RiLockPasswordLine className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign In Required
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Please sign in to access your CV dashboard, manage professional profiles, and customize AI-optimized resumes.
          </p>
          <SignInButton mode="modal">
            <Button size="lg" variant="primary" className="w-full justify-center">
              <RiLoginBoxLine className="size-5 mr-2" />
              <span>Sign In to Continue</span>
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

