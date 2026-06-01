import type { Metadata } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "../components/AppShell";
import { WishlistProvider } from "../components/WishlistProvider";
import { ThemeProvider } from "../components/ThemeProvider";
import "../styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

// Distinct display face for headings (.display-font) — geometric and tighter
// than the Poppins body so the type hierarchy actually reads.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-sans",
  weight: ["500", "600", "700"],
});

// Applied before first paint to avoid a flash of the wrong theme (FOUC).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("aggregator-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

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
    <html
      lang="en"
      className={`${poppins.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.1),transparent_30%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.06),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(244,239,232,0.36))]" />
          <ThemeProvider>
            <WishlistProvider>
              <AppShell>{children}</AppShell>
            </WishlistProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
