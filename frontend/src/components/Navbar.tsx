"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  UserButton,
  useAuth,
  useUser,
  SignInButton,
} from "@clerk/react";
import {
  RiFileTextLine,
  RiDashboardLine,
  RiUserLine,
  RiSettings3Line,
  RiMenuLine,
  RiCloseLine,
  RiLoginBoxLine,
} from "@remixicon/react";
import { cx } from "@/lib/utils";
import { configureApiClient } from "@/lib/api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: RiDashboardLine },
  { name: "Profile", href: "/profile", icon: RiUserLine },
  { name: "Settings", href: "/settings", icon: RiSettings3Line },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  // Keep API client synchronised with Clerk credentials
  useEffect(() => {
    if (getToken) {
      configureApiClient(getToken, userId);
    }
  }, [getToken, userId]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
            id="brand-logo-link"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs group-hover:bg-blue-500 transition-colors">
              <RiFileTextLine className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                CV Builder
                <Badge variant="blue" size="sm" className="hidden sm:inline-flex">
                  ATS Pro
                </Badge>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Only visible when signed in */}
          <Show when="signed-in">
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-800">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-link-${item.name.toLowerCase()}`}
                    className={cx(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 text-blue-600 font-semibold dark:bg-slate-800 dark:text-blue-400"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </Show>
        </div>

        {/* Right: User / Auth actions */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Candidate"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Active Session
              </span>
            </div>
            <div className="size-8 flex items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8 rounded-full border border-slate-200 dark:border-slate-700",
                  },
                }}
              />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="sm" variant="primary" id="nav-signin-button">
                <RiLoginBoxLine className="size-4" />
                <span>Sign In</span>
              </Button>
            </SignInButton>
          </Show>

          {/* Mobile hamburger button - Only visible when signed in */}
          <Show when="signed-in">
            <div className="flex md:hidden">
              <button
                type="button"
                id="mobile-menu-toggle"
                aria-label="Toggle mobile menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? (
                  <RiCloseLine className="size-5" />
                ) : (
                  <RiMenuLine className="size-5" />
                )}
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <Show when="signed-in">
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-blue-600 font-semibold dark:bg-slate-800 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </Show>
    </header>
  );
}
