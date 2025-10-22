import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LLM Response Quality Analyzer | GenAI Labs",
  description: "Analyze and compare LLM responses across different parameters. Understand how temperature and top_p affect response quality with comprehensive metrics.",
  keywords: ["LLM", "AI", "response quality", "analysis", "metrics", "GenAI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased dark:bg-gray-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
