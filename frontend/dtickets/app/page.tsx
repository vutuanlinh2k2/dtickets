"use client" // This page component needs to be client-side to use useAppState

import EventList from "@/components/EventList"
import { useAppState } from "@/components/AppStateProvider"

export default function HomePage() {
  const { isWalletConnected, walletAddress } = useAppState()
  return (
    <div>
      <h1 className="text-3xl font-bold text-sea mb-6 text-center">Discover Events</h1>
      <EventList isWalletConnected={isWalletConnected} walletAddress={walletAddress} />
    </div>
  )
}
