import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/Providers";
import "./globals.css";

/*
 * Self-hosted variable fonts (latin), so builds never depend on reaching Google:
 * Google Sans Flex for reading, Archivo (width 62 to 125, upright and italic) for the race voice, Google Sans Code for
 * references and bib codes.
 */
const flex = localFont({
  variable: "--font-flex",
  src: [{ path: "./fonts/flex-normal.woff2", weight: "300 800", style: "normal" }],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
});

const archivo = localFont({
  variable: "--font-archivo",
  src: [
    { path: "./fonts/archivo-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/archivo-italic.woff2", weight: "100 900", style: "italic" },
  ],
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

const code = localFont({
  variable: "--font-code",
  src: [{ path: "./fonts/code-normal.woff2", weight: "300 800", style: "normal" }],
  display: "swap",
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3217"),
  title: {
    default: "Run for Independence 2027 · NRIF",
    template: "%s · Run for Independence",
  },
  description:
    "Run, walk or join from abroad on Saturday 30 January 2027 at Independence Stadium, Bakau. Every entry grows NRIF's Endowment Fund for Gambian research and innovation.",
  icons: { icon: "/brand/icon.png" },
  openGraph: {
    title: "Run for Independence 2027",
    description: "One Day, One Nation. 21K, 10K, 5K, the 1.965K Heritage walk and virtual runs.",
    images: ["/media/hero-coast.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${flex.variable} ${archivo.variable} ${code.variable} antialiased`}>
      <body className="min-h-dvh">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
