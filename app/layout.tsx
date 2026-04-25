import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "./lib/i18n";
import LangSwitcher from "./components/LangSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JUSTINCASE · 万一 — Parametric cover for the day shipping doesn't go to plan",
  description:
    "Your cargo's late, we pay anyway. AI risk copilot that turns route, chokepoint and prediction-market signal into a parametric shipping delay policy that pays by timestamp, not by adjuster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col grid-bg scanlines">
        <LangProvider>
          {children}
          <LangSwitcher />
        </LangProvider>
      </body>
    </html>
  );
}
