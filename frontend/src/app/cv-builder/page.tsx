import { Suspense } from "react";
import CvBuilderEditorClient from "@/components/CvEditor/CvBuilderEditorClient";

export default function CvBuilderIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loading CV Editor...
            </p>
          </div>
        </div>
      }
    >
      <CvBuilderEditorClient />
    </Suspense>
  );
}
