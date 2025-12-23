import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query.provider";
import { AuthProvider } from "@/providers/auth.provider";
import { ThemeProvider } from "@/providers/theme.provider";
import { SocketProvider } from "@/lib/socket/socket-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "FastQuizParty - Plateforme de Quiz Multijoueur",
    template: "%s | FastQuizParty"
  },
  description: "Créez et jouez à des quiz interactifs en temps réel. Défie tes amis dans des parties multijoueurs avec FastQuizParty, la plateforme de quiz ultime.",
  keywords: ["quiz", "jeux", "multijoueur", "trivia", "culture générale", "éducation", "divertissement"],
  authors: [{ name: "FastQuizParty Team" }],
  creator: "FastQuizParty",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    title: "FastQuizParty - Plateforme de Quiz Multijoueur",
    description: "Créez et jouez à des quiz interactifs en temps réel. Défie tes amis dans des parties multijoueurs.",
    siteName: "FastQuizParty",
  },
  twitter: {
    card: "summary_large_image",
    title: "FastQuizParty - Plateforme de Quiz Multijoueur",
    description: "Créez et jouez à des quiz interactifs en temps réel. Défie tes amis dans des parties multijoueurs.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                <SocketProvider>
                  {children}
                  <OfflineIndicator />
                  <Toaster />
                </SocketProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
