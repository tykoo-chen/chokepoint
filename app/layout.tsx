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
  title: "CHOKEPOINT — AI Parametric Supply Chain Cover",
  description:
    "AI risk copilot that translates route, chokepoint and prediction-market signal into parametric shipping delay insurance.",
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
