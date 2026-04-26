import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-sans' });

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: "IL Stockroom",
  description: "Sistema de gestión de inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full antialiased", geistMono.variable, geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
