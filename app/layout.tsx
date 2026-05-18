import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKR Tracker",
  description: "Track your OKR progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
