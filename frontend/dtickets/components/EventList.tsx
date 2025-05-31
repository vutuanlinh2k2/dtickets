"use client"

import { useState, useMemo } from "react"
import EventCard from "./EventCard"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

export interface Event {
  id: string
  name: string
  dateTime: number // Unix timestamp
  venueName: string
  ticketPrice: number // in SUI (cannot be 0)
  shortDescription: string
  remainingTickets: number
  totalTickets: number
  imageUrl?: string // Optional event image
}

interface EventListProps {
  initialEvents?: Event[]
  isWalletConnected: boolean
  walletAddress: string | null
}

// Mock initial events data
const mockEvents: Event[] = [
  {
    id: "1",
    name: "Sui Blockchain Summit",
    dateTime: Math.floor(Date.now() / 1000) + 86400 * 7,
    venueName: "Crypto Convention Center",
    ticketPrice: 25,
    shortDescription:
      "Join us for an immersive deep dive into the Sui ecosystem, featuring keynote speakers, hands-on workshops, networking opportunities, and exclusive insights into the future of decentralized applications on the Sui blockchain. This is a must-attend event for developers, investors, and enthusiasts alike who are keen to explore the cutting-edge technology and potential of Sui. We will cover topics ranging from Move programming to DeFi, NFTs, and gaming.",
    remainingTickets: 87,
    totalTickets: 200,
    imageUrl:
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
  },
  {
    id: "2",
    name: "NFT Art Gala",
    dateTime: Math.floor(Date.now() / 1000) + 86400 * 14,
    venueName: "Digital Art Gallery",
    ticketPrice: 50,
    shortDescription: "Exclusive showcase of NFT artworks.",
    remainingTickets: 30,
    totalTickets: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop",
  },
  {
    id: "3",
    name: "Decentralized Music Fest",
    dateTime: Math.floor(Date.now() / 1000) + 86400 * 30,
    venueName: "Open Air Amphitheater",
    ticketPrice: 10,
    shortDescription: "Live music powered by blockchain.",
    remainingTickets: 150,
    totalTickets: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop",
  },
  {
    id: "4",
    name: "Past Tech Conference",
    dateTime: Math.floor(Date.now() / 1000) - 86400 * 5,
    venueName: "Innovation Hub",
    ticketPrice: 15,
    shortDescription: "A look back at tech trends.",
    remainingTickets: 0,
    totalTickets: 100,
    // No image for this event - will show background pattern
  },
  {
    id: "5",
    name: "Web3 Gaming Expo",
    dateTime: Math.floor(Date.now() / 1000) + 86400 * 2,
    venueName: "Gamer's Paradise",
    ticketPrice: 5,
    shortDescription: "Explore the future of gaming.",
    remainingTickets: 200,
    totalTickets: 300,
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop",
  },
  {
    id: "6",
    name: "Community Meetup: Web3 Future",
    dateTime: Math.floor(Date.now() / 1000) + 86400 * 10,
    venueName: "Local Co-working Space",
    ticketPrice: 2,
    shortDescription:
      "A casual meetup for Web3 enthusiasts to discuss the latest trends, share projects, and network. Beginners welcome! Refreshments will be provided.",
    remainingTickets: 50,
    totalTickets: 50,
    // No image for this event - will show background pattern
  },
]

export default function EventList({
  initialEvents = mockEvents,
  isWalletConnected,
  walletAddress,
}: EventListProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">(
    "all"
  )
  const [priceFilter, setPriceFilter] = useState<string>("all")

  const handleBuyTicket = async (
    eventId: string,
    recipients: string[]
  ): Promise<"success" | "failed" | "no_tickets"> => {
    console.log(
      `Attempting to buy ${recipients.length} tickets for event: ${eventId}`
    )
    console.log("Recipients:", recipients)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    const eventToUpdate = events.find(e => e.id === eventId)
    if (!eventToUpdate || eventToUpdate.remainingTickets < recipients.length) {
      return "no_tickets"
    }

    // Simulate success/failure
    const success = Math.random() > 0.2 // 80% success rate
    if (success) {
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId
            ? {
                ...e,
                remainingTickets: Math.max(
                  0,
                  e.remainingTickets - recipients.length
                ),
              }
            : e
        )
      )
      return "success"
    } else {
      return "failed"
    }
  }

  const filteredEvents = useMemo(() => {
    let tempEvents = [...events]
    const now = Math.floor(Date.now() / 1000)

    // Date filter
    if (dateFilter === "upcoming") {
      tempEvents = tempEvents.filter(event => event.dateTime >= now)
    } else if (dateFilter === "past") {
      tempEvents = tempEvents.filter(event => event.dateTime < now)
    }

    // Price filter
    if (priceFilter !== "all") {
      tempEvents = tempEvents.filter(event => {
        if (priceFilter === "0-10")
          return event.ticketPrice > 0 && event.ticketPrice <= 10
        if (priceFilter === "10-50")
          return event.ticketPrice > 10 && event.ticketPrice <= 50
        if (priceFilter === "50+") return event.ticketPrice > 50
        return true
      })
    }

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      tempEvents = tempEvents.filter(
        event =>
          event.name.toLowerCase().includes(lowerSearchTerm) ||
          event.venueName.toLowerCase().includes(lowerSearchTerm) ||
          event.shortDescription.toLowerCase().includes(lowerSearchTerm)
      )
    }

    return tempEvents
  }, [events, searchTerm, dateFilter, priceFilter])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search events by name, venue, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-ocean border-sea text-cloud focus:ring-sea w-full hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300"
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={dateFilter}
            onValueChange={(value: "all" | "upcoming" | "past") =>
              setDateFilter(value)
            }
          >
            <SelectTrigger className="w-full md:w-[180px] bg-ocean border-sea text-cloud focus:ring-sea hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent className="bg-ocean text-cloud border-sea">
              <SelectItem
                value="all"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                All Dates
              </SelectItem>
              <SelectItem
                value="upcoming"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                Upcoming
              </SelectItem>
              <SelectItem
                value="past"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                Past
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priceFilter}
            onValueChange={value => setPriceFilter(value)}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-ocean border-sea text-cloud focus:ring-sea hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300">
              <SelectValue placeholder="Filter by price" />
            </SelectTrigger>
            <SelectContent className="bg-ocean text-cloud border-sea">
              <SelectItem
                value="all"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                All Prices
              </SelectItem>
              <SelectItem
                value="0-10"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                1-10 SUI
              </SelectItem>
              <SelectItem
                value="10-50"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                10-50 SUI
              </SelectItem>
              <SelectItem
                value="50+"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                50+ SUI
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isWalletConnected={isWalletConnected}
              walletAddress={walletAddress}
              onBuyTicket={handleBuyTicket}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-aqua text-lg py-10">
          No events match your criteria.
        </p>
      )}
    </div>
  )
}
