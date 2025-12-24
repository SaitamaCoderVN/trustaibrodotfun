import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TrustAIBro.Fun | AI Battle Arena - Bet on AI Models",
  description: "Watch AI models compete in Iterated Prisoner's Dilemma. Bet on winners with SOL and win rewards.",
  icons: {
    icon: "/trustaibrodotfun.png",
    apple: "/trustaibrodotfun.png",
  },
  openGraph: {
    title: "TrustAIBro.Fun | AI Battle Arena",
    description: "Watch AI models compete in Iterated Prisoner's Dilemma. Bet on winners with SOL and win rewards.",
    images: ["/trustaibrodotfun.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustAIBro.Fun | AI Battle Arena",
    description: "Watch AI models compete in Iterated Prisoner's Dilemma. Bet on winners with SOL and win rewards.",
    images: ["/trustaibrodotfun.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-background font-pixel-body">
        <Providers>{children}</Providers>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}