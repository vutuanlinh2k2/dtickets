"use client" // This page component needs to be client-side to use useAppState

import MyEventsList from "@/components/MyEventsList"
import { useAppState } from "@/components/AppStateProvider"

export default function MyEventsPage() {
  const { walletAddress } = useAppState()
  return <MyEventsList walletAddress={walletAddress} />
}
