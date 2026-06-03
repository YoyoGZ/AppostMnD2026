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
  title: "MundiApp26 | La App para el Mundial 🏆",
  description: "Plataforma premium para el seguimiento interactivo, pronósticos, duelos y estadísticas en tiempo real del Mundial de Fútbol 2026.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192x192.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: "MundiApp26 | La App para el Mundial 🏆",
    description: "Creá tu propia liga, competí con tus amigos pronosticando los resultados de la Copa del Mundo 2026, desafiá a otros en el Coliseo de Duelos y chateá en tiempo real. ¡Viví el mundial a otro nivel!",
    url: "https://mundiapp26.com/",
    siteName: "MundiApp26",
    images: [
      {
        url: "https://mundiapp26.com/assets/logo_oficial.png",
        width: 512,
        height: 512,
        alt: "MundiApp26 Logo Oficial",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MundiApp26 | La App para el Mundial 🏆",
    description: "Creá tu propia liga, competí con tus amigos pronosticando la Copa del Mundo, desafiá a otros en el Coliseo de Duelos y chateá en tiempo real.",
    images: ["https://mundiapp26.com/assets/logo_oficial.png"],
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
