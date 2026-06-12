import type { Metadata } from "next";
import { Work_Sans, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "./query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TopProgressBar } from "./_components/top-progress-bar";

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "IL Stockroom",
  description: "Sistema de gestión de inventario para International Label",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IL Stockroom",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore  = await cookies()
  const savedTheme   = cookieStore.get('preferred-theme')?.value
  const defaultTheme = savedTheme === 'dark' ? 'dark' : 'light'

  return (
    <html
      lang="es"
      className={cn("h-full antialiased", workSans.variable, bricolage.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider defaultTheme={defaultTheme}>
        <QueryProvider>
          <TopProgressBar />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:       '!bg-card !border !border-border !rounded-none !shadow-none font-sans',
                title:       '!text-[10px] !font-bold !uppercase !tracking-widest !text-foreground',
                description: '!text-[10px] !text-muted-foreground !font-normal',
                icon:        '!text-foreground/50',
                success:     '!border-l-2 !border-l-green-600',
                error:       '!border-l-2 !border-l-red-600',
                warning:     '!border-l-2 !border-l-yellow-500',
                info:        '!border-l-2 !border-l-[#008dc2]',
              },
            }}
          />
        </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
