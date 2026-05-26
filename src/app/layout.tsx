import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PWARegister } from "@/components/pwa/PWARegister";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MundiApp26 | Dashboard de Resultados y Pronosticos",
  description: "Plataforma premium para el seguimiento interactivo de MundiApp26. Análisis de grupos, calendarios y estadísticas en tiempo real.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192x192.png',
    shortcut: '/favicon.png',
  }
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
      <body className="antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <PWARegister />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
