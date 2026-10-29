import type { Metadata } from "next";

import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Heygen API Demo",
  description: "Heygen API Demo: A simple demo for Heygen API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col h-full">
        <AuthProvider>
          <Header />
          <main className="flex flex-col h-full flex-1 bg-slate-200 overflow-y-auto p-4">
            {children}
          </main>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
