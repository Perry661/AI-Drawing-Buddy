import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Pixel Co-Creation Studio",
  description: "A practical pixel-art editor with coordinate-aware AI critique and generated revisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
