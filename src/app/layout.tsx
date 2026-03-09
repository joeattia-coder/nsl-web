import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "National Snooker League",
  description: "Your professional snooker platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  );
}