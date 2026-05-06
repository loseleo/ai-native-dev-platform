import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Native Dev Platform",
  description: "Boss-driven AI Native Software Company OS",
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
