import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "./query-provider";

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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:       '!bg-[#F5F2EA] !border !border-[#1A1A1A]/20 !rounded-none !shadow-none font-sans',
                title:       '!text-[10px] !font-bold !uppercase !tracking-widest !text-[#1A1A1A]',
                description: '!text-[10px] !text-[#5f5e59] !font-normal',
                icon:        '!text-[#1A1A1A]/50',
                success:     '!border-l-2 !border-l-green-600',
                error:       '!border-l-2 !border-l-red-600',
                warning:     '!border-l-2 !border-l-yellow-500',
                info:        '!border-l-2 !border-l-[#008dc2]',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
