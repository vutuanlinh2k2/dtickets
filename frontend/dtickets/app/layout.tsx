import type React from "react";
import type { Metadata } from "next";
import "./globals.css"; // Should be app/globals.css
import "@mysten/dapp-kit/dist/index.css";
import HeaderClient from "@/components/HeaderClient";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/app/Providers";

export const metadata: Metadata = {
  title: "DTickets",
  description:
    "DTickets is a platform for creating and managing events as NFTs on Sui.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="bg-deep-ocean text-cloud min-h-screen flex flex-col"
        suppressHydrationWarning={true}
      >
        <Providers>
          <HeaderClient />
          <main className="flex-grow container mx-auto py-8">{children}</main>
          <footer className="bg-ocean border-t border-sea p-4 text-center text-aqua text-sm">
            © {new Date().getFullYear()} SuiTicketing Platform. All rights
            reserved.
          </footer>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
