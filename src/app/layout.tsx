import type { Metadata } from "next";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import { isClerkConfigured } from "@/libs/clerk-config";

export const metadata: Metadata = {
  title: "Heygen API Demo",
  description: "Heygen API Demo: A simple demo for Heygen API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <>
      <Header />
      <main className="flex flex-col h-full flex-1 bg-slate-200 overflow-y-auto p-4">
        {children}
      </main>
      <Toaster position="top-right" />
    </>
  );

  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col h-full">
        {isClerkConfigured ? (
          <ClerkProvider dynamic>{body}</ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
