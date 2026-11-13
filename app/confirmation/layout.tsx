import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/Header";

export const metadata: Metadata = { title: "You're in" };

export default function ConfirmationLayout({ children }: LayoutProps<"/confirmation">) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh pt-[var(--header-h)]">{children}</main>
    </>
  );
}
