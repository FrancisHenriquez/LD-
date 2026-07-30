import type { Metadata } from "next";
import "@fontsource/unifrakturcook/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "León Dufour · Vocabulario de teología bíblica",
  description: "Consulta editorial en español del Vocabulario de teología bíblica.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
