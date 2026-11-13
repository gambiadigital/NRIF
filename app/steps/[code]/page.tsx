import { Suspense } from "react";
import type { Metadata } from "next";
import { StepsPage } from "./StepsPage";

export const metadata: Metadata = { title: "Steps challenge" };

export function generateStaticParams() {
  return [{ code: "SC-1047" }, { code: "SC-1213" }];
}

export default function Page({ params }: PageProps<"/steps/[code]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/steps/[code]">["params"] }) {
  const { code } = await params;
  return <StepsPage code={decodeURIComponent(code).toUpperCase()} />;
}
