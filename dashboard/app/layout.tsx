import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import MainLayout from "@/components/MainLayout";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OralGuard — Specialist Diagnostic Portal",
  description: "Advanced clinical triage and XAI diagnostic interface for oral cancer detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "dark", inter.variable, outfit.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-slate-950">
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
