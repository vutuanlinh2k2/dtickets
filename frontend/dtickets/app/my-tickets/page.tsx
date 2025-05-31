"use client" // This page component needs to be client-side to use useAppState

import MyTicketsList from "@/components/MyTicketsList"
import { useAppState } from "@/components/AppStateProvider"

export default function MyTicketsPage() {
  const { walletAddress } = useAppState()
  return <MyTicketsList walletAddress={walletAddress} />
}
