import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "León Dufour · Vocabulario de teología bíblica",
  description: "Consulta editorial en español del Vocabulario de teología bíblica.",
  other: { "codex-preview": "development" },
};

/**
 * Define la estructura HTML común para todas las páginas y declara el español
 * como idioma principal del documento.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
