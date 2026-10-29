import type { Metadata, Viewport } from "next";
import "./globals.css";
import PageViewTracker from "./Components/PageViewTracker";
import PWARegistration from "./Components/PWARegistration";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "BuildMate - Ideas into Reality",
  description: "Stop building alone. Discover project ideas, find teammates, and build together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuildMate",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2342F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-[#08090d] text-white">
        <PWARegistration />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
