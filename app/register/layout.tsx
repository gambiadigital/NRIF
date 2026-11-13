import type { Metadata } from "next";
import { RegisterShell } from "@/components/register/Shell";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterLayout({ children }: LayoutProps<"/register">) {
  return <RegisterShell>{children}</RegisterShell>;
}
