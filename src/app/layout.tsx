import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthProvider";

import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "IndiaForex | Institutional Market Terminal",
  description: "Real-time Forex & Stock Market Dashboard for Indian Traders",
  manifest: "/manifest.json",
  icons: {
    apple: "/logo.png", // Fallback to logo for now
  }
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevent auto-zoom on inputs
  userScalable: false,
};

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <AuthProvider>
          <ServiceWorkerRegister />
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
