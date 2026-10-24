import type { Metadata } from "next";
import "./globals.css";
import PageViewTracker from "./Components/PageViewTracker";

export const metadata: Metadata = {
  title: "BuildMate - Ideas into Reality",
  description: "Stop building alone. Discover project ideas, find teammates, and build together.",
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#08090d] text-white">
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
