import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider, themeScript } from "@/components/admin/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simpang",
  description: "Simpang is a platform for creating and sharing tests.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // 저장된 테마는 첫 페인트 전에 적용돼야 하고, 그러면 서버가 보낸
      // 클래스와 달라진다. 이 불일치는 의도된 것이라 경고를 끈다.
      suppressHydrationWarning
    >
      <head>
        {/* 저장된 테마를 렌더 전에 칠한다. 없으면 기본 상태가 잠깐 보였다 바뀐다. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
