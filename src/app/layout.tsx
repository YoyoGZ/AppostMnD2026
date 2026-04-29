import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mundial 2026 | Dashboard Oficial de Resultados",
  description: "Plataforma premium para el seguimiento interactivo de la Copa del Mundo 2026. Análisis de grupos, calendarios y estadísticas en tiempo real.",
};

/**
 * Root Layout: Capa mínima HTML.
 * NO incluye Shell ni Sidebar. Eso vive en (dashboard)/layout.tsx.
 * Así la página de login (/) renderiza sin chrome de navegación.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
