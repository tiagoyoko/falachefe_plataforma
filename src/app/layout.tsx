import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Falachefe - Plataforma SaaS de Chat Multagente",
  description:
    "Automatize vendas, marketing e suporte com agentes de IA especializados via WhatsApp. Sistema de memória persistente, orquestração inteligente e painel administrativo completo.",
  keywords: ["WhatsApp", "Chat Multagente", "IA", "Automação", "SaaS", "Agentes Inteligentes"],
  authors: [{ name: "Falachefe Team" }],
  openGraph: {
    title: "Falachefe - Chat Multagente via WhatsApp",
    description: "Plataforma SaaS para automação de atendimento com agentes de IA especializados",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
