import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import HeaderAuth from "../components/HeaderAuth";
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
    <html lang="en" className={poppins.variable}>
      <body>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.58),rgba(244,239,232,0.42))]" />
          <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="mb-8 rounded-[28px] border border-black/10 bg-white/70 px-5 py-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    className="display-font text-2xl font-semibold text-slate-950"
                    href="/"
                  >
                    Aggregator Market
                  </Link>
                </div>
                <nav className="flex flex-wrap gap-2 text-sm font-medium items-center">
                  <Link
                    className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
                    href="/products"
                  >
                    Products
                  </Link>
                  <Link
                    className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
                    href="/compare"
                  >
                    Compare
                  </Link>
                  {/* HeaderAuth renders Login/Register when not authenticated and avatar when signed in */}
                  <HeaderAuth />
                </nav>
              </div>
            </header>
            <main className="flex-1 pb-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
