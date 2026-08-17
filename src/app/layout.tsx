import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exordio DeckLab – Yu-Gi-Oh! Deck Builder & Analytics",
  description:
    "Construye, analiza y optimiza tus decks de Yu-Gi-Oh! con datos del meta y asistente táctico en tiempo real.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

import { IdealEnvironmentProvider } from "@/context/IdealEnvironmentContext";
import { IdealSyncLoaderModal } from "@/components/collection/IdealSyncLoaderModal";
import { IdealReportModal } from "@/components/collection/IdealReportModal";
import { PhysicalStagingAssistantModal } from "@/components/collection/PhysicalStagingAssistantModal";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <IdealEnvironmentProvider>
              {children}
              <IdealSyncLoaderModal />
              <IdealReportModal />
              <PhysicalStagingAssistantModal />
            </IdealEnvironmentProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

