import { AdminShell } from "@/components/admin/Shell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
