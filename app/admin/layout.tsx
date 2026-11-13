import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/Shell";

export const metadata: Metadata = { title: { default: "Run admin", template: "%s · Run admin" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
