import CvBuilderEditorPage from "@/components/CvEditor/CvBuilderEditorClient";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function Page() {
  return <CvBuilderEditorPage />;
}
