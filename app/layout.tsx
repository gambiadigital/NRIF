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

const DESCRIPTION =
  "Sign up for Run for Independence 2027 on Saturday 30 January at Independence Stadium, Bakau: the 5 km run, the 1.965 km Heritage Walk, or the Diaspora Virtual Run from anywhere. Every entry grows NRIF's Endowment Fund for Gambian research and innovation.";
const SHARE = "One Day, One Nation. Saturday 30 January 2027 at Independence Stadium, Bakau: a 5 km run, the 1.965 km Heritage Walk, and a virtual run for Gambians abroad. Sign up now.";

/*
 * What search engines and link previews (WhatsApp, Facebook, X, LinkedIn) show. The preview picture is
 * app/opengraph-image.jpg (1200x630, also used for X), picked up by Next.js and made absolute with metadataBase,
 * so NEXT_PUBLIC_SITE_URL must be the public address.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3217"),
  applicationName: "Run for Independence",
  title: {
    default: "Run for Independence 2027 · NRIF",
    template: "%s · Run for Independence",
  },
  description: DESCRIPTION,
  keywords: ["Run for Independence", "Run4Independence", "NRIF", "National Research and Innovation Fund", "The Gambia", "Bakau", "Independence Stadium", "5 km run", "Heritage Walk", "virtual run", "diaspora", "Endowment Fund"],
  authors: [{ name: "National Research & Innovation Fund" }],
  creator: "National Research & Innovation Fund",
  publisher: "National Research & Innovation Fund",
  icons: { icon: "/brand/icon.png" },
  openGraph: {
    type: "website",
    siteName: "Run for Independence · NRIF",
    locale: "en_GB",
    url: "/",
    title: "Run for Independence 2027",
    description: SHARE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Run for Independence 2027",
    description: SHARE,
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
