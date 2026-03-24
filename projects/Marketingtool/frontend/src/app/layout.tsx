// Root Layout
/**
 * Root layout with providers and global styles
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marketing Tool",
  description: "네이버 플레이스 마케팅 분석 툴",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
