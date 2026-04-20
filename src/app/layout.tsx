import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nöbetçi - Hastane Nöbet Planlama",
  description: "Doktor nöbetlerini adil ve otomatik dağıtan akıllı sistem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full scroll-smooth">
      <body
        className={`${outfit.variable} ${inter.variable} font-outfit min-h-full antialiased bg-background text-foreground`}
      >
        {/* Aurora Background Effects - Subtle and high-end */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[120px] rounded-full animate-pulse [animation-delay:3s]" />
          <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full" />
        </div>

        <div className="flex min-h-screen">
          <Sidebar />
          <CommandPalette />
          
          <main className="flex-1 w-full overflow-x-hidden relative z-10">
            {/* Mobile: Add top padding for fixed header */}
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 pt-20 md:pt-6 lg:pt-10">
              {children}
            </div>
          </main>
        </div>

        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
