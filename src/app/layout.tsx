import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "易问六爻",
  description: "六爻纳甲传统文化娱乐互动 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
