import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "../components/AppShell";
import { WishlistProvider } from "../components/WishlistProvider";
import "../styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aggregator Market",
  description:
    "E-commerce product aggregation frontend powered by the live backend APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.58),rgba(244,239,232,0.42))]" />
          <WishlistProvider>
            <AppShell>{children}</AppShell>
          </WishlistProvider>
        </div>
      </body>
    </html>
  );
}
