import type { Metadata, Viewport } from "next";
import { Nunito, Space_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tango = CMV",
    template: "%s · Tango = CMV",
  },
  description:
    "Operating system for restaurants. Real-time CMV, schedules, finance and team.",
  applicationName: "Tango",
  authors: [{ name: "Tango" }],
  keywords: ["CMV", "restaurant", "operations", "Tango", "sushi"],
  openGraph: {
    title: "Tango = CMV",
    description: "Management that doesn't stop at the kitchen.",
    images: ["/tango-stacked.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = getServerLocale();
  return (
    <html lang={initialLocale} className={`${nunito.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen bg-tango-black text-tango-white font-sans antialiased">
        <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
