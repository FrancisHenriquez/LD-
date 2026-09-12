import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "León Dufour · Vocabulario Biblico",
  description: "Consulta editorial en español del Vocabulario de teología bíblica.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=ld-monogram", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=ld-monogram",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  other: { "codex-preview": "development" },
};

/**
 * Define la estructura HTML común para todas las páginas y declara el español
 * como idioma principal del documento.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}<Analytics /></body></html>;
}
