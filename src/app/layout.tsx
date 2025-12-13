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
      <body className="antialiased min-h-screen bg-background">
        <Providers>{children}</Providers>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}