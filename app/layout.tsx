import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "WOYOhub - Intellectual Ascent",
  description:
    "Your personal learning management system. Track courses, build projects, master skills, and level up your career.",
  keywords: ["learning", "skill tracking", "career development", "portfolio"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0049db",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors theme="light" />
      </body>
    </html>
  );
}
