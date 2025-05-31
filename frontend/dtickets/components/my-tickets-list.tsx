"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TicketIcon, AlertTriangle, CalendarDays, MapPin, Loader2 } from "lucide-react"
import { formatUnixTimestamp } from "@/lib/utils"

interface OwnedTicket {
  id: string
  eventId: string
  eventName: string
  eventDate: number
  venueName: string
  ticketNumber: string // Or NFT ID
  purchaseDate: number
  status: "upcoming" | "past"
}

interface MyTicketsListProps {
  walletAddress: string | null // Pass null if not connected
}

// Mock function to fetch tickets for a wallet
const fetchMockUserTickets = async (address: string | null): Promise<OwnedTicket[]> => {
  if (!address) return []
  console.log(`Fetching tickets for ${address}...`)
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay

  const now = Math.floor(Date.now() / 1000)

  // In a real app, this would be an API call to fetch NFTs
  return [
    {
      id: "ticket1",
      eventId: "1",
      eventName: "Sui Blockchain Summit",
      eventDate: now + 86400 * 7, // 7 days from now
      venueName: "Crypto Convention Center",
      ticketNumber: "NFT#00123",
      purchaseDate: now - 86400 * 2, // 2 days ago
      status: "upcoming",
    },
    {
      id: "ticket2",
      eventId: "3",
      eventName: "Decentralized Music Fest",
      eventDate: now + 86400 * 30, // 30 days from now
      venueName: "Open Air Amphitheater",
      ticketNumber: "NFT#00456",
      purchaseDate: now - 86400 * 5, // 5 days ago
      status: "upcoming",
    },
    {
      id: "ticket3",
      eventId: "past1",
      eventName: "DeFi Workshop",
      eventDate: now - 86400 * 10, // 10 days ago
      venueName: "Innovation Hub",
      ticketNumber: "NFT#00789",
      purchaseDate: now - 86400 * 15, // 15 days ago
      status: "past",
    },
    {
      id: "ticket4",
      eventId: "past2",
      eventName: "NFT Art Exhibition",
      eventDate: now - 86400 * 3, // 3 days ago
      venueName: "Digital Gallery",
      ticketNumber: "NFT#00321",
      purchaseDate: now - 86400 * 8, // 8 days ago
      status: "past",
    },
    {
      id: "ticket5",
      eventId: "6",
      eventName: "Community Meetup: Web3 Future",
      eventDate: now + 86400 * 10, // 10 days from now
      venueName: "Local Co-working Space",
      ticketNumber: "NFT#00654",
      purchaseDate: now - 86400 * 1, // 1 day ago
      status: "upcoming",
    },
  ]
}

export default function MyTicketsList({ walletAddress }: MyTicketsListProps) {
  const [tickets, setTickets] = useState<OwnedTicket[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      setIsLoading(true)
      fetchMockUserTickets(walletAddress)
        .then(setTickets)
        .finally(() => setIsLoading(false))
    } else {
      setTickets([]) // Clear tickets if wallet disconnects
    }
  }, [walletAddress])

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p>Please connect your wallet to view your tickets.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Your Tickets</h2>
        <p>Fetching your ticket collection...</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <TicketIcon className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
        <p>You don't own any tickets yet. Start by purchasing tickets to upcoming events!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-sea mb-6">My Tickets</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="bg-ocean text-cloud border-sea">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-sea flex items-center">
                  <TicketIcon className="mr-2 h-5 w-5" />
                  {ticket.eventName}
                </CardTitle>
                <Badge
                  variant={ticket.status === "upcoming" ? "default" : "secondary"}
                  className={ticket.status === "upcoming" ? "bg-green-600 text-white" : "bg-gray-600 text-white"}
                >
                  {ticket.status === "upcoming" ? "Upcoming" : "Past"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-aqua text-sm">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formatUnixTimestamp(ticket.eventDate)}
              </div>
              <div className="flex items-center text-aqua text-sm">
                <MapPin className="mr-2 h-4 w-4" />
                {ticket.venueName}
              </div>
              <div className="space-y-1">
                <p className="text-aqua text-sm">Ticket ID:</p>
                <p className="text-cloud font-mono text-sm">{ticket.ticketNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-aqua text-sm">Purchased:</p>
                <p className="text-cloud text-sm">{formatUnixTimestamp(ticket.purchaseDate)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Default props for Next.js
MyTicketsList.defaultProps = {
  walletAddress: null,
}
