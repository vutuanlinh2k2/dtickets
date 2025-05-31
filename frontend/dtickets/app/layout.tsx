import type React from "react"
import type { Metadata } from "next"
import "./globals.css" // Should be app/globals.css
import { AppStateProvider } from "@/components/AppStateProvider"
import HeaderClient from "@/components/HeaderClient"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "SuiTicketing dApp",
  description: "Discover, purchase, and manage event tickets as NFTs on Sui.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-deep-ocean text-cloud min-h-screen flex flex-col">
        <AppStateProvider>
          <HeaderClient />
          <main className="flex-grow container mx-auto py-8">{children}</main>
          <footer className="bg-ocean border-t border-sea p-4 text-center text-aqua text-sm">
            © {new Date().getFullYear()} SuiTicketing Platform. All rights reserved.
          </footer>
          <Toaster />
        </AppStateProvider>
      </body>
    </html>
  )
}
