import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "./query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-sans' });

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-display',
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
      className={cn("h-full antialiased", geistMono.variable, geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider defaultTheme={defaultTheme}>
        <QueryProvider>
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
