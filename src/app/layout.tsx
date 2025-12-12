import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Neural Dilemma | AI Prisoner's Dilemma Tournament",
  description: "Watch AI models compete in game theory. Bet on winners with SOL/USDC.",
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