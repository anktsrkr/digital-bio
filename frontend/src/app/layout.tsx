import type { Metadata } from "next";
import { ClerkClientProvider } from "@/components/ClerkClientProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Builder — ATS-Compliant Professional Resume Builder",
  description:
    "Design and generate ATS-compliant single-column professional CVs with real-time preview and precision QuestPDF export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkClientProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className} h-full antialiased dark:bg-gray-950`}
      >
        <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-blue-900/60 dark:selection:text-blue-200">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AuthGuard>{children}</AuthGuard>
          </main>
          <ToastProvider />
        </body>
      </html>
    </ClerkClientProvider>
  );
}
