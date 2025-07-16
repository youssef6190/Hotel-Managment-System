import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travio",
  description: "Your peaceful retreat destination",
  icons: {
    icon: "/website_tab_icon.svg",
    shortcut: "/website_tab_icon.svg",
    apple: "/website_tab_icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/website_tab_icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/website_tab_icon.svg" />
        <link rel="apple-touch-icon" href="/website_tab_icon.svg" />
      </head>
      <body
      suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
