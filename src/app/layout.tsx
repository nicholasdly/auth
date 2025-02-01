import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

export const metadata: Metadata = {
  title: "Next.js Auth Starter",
  description: "Get started rolling your own auth with Next.js and Postgres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased",
        )}
      >
        {children}
        <Toaster theme="light" position="bottom-center" richColors />
      </body>
    </html>
  );
}
