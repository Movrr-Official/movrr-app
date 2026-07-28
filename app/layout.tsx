import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import QueryClientProvider from "@/providers/QueryClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Movrr - Rider and Advertiser Workspace",
  description: "Authenticated rider and advertiser product surfaces for MOVRR.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrainsMono.variable} antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <QueryClientProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
