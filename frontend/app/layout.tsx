import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaraMeet | Premium Video Meetings for Everyone",
  description: "LaraMeet is a secure, high-performance video conferencing platform for seamless communication. Powered by LaraSoft, designed by FarookHriody.",
  keywords: ["Video Conferencing", "Online Meetings", "LaraMeet", "FarookHriody", "TheLaraSoft", "Free Video Calls"],
  authors: [{ name: "FarookHriody", url: "https://farookhridoy.com" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
