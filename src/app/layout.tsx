import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/themes/provider";
import "./globals.css";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Casos e Evidências",
  description: "Compilar e organizar evidências de WhatsApp por Caso",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
