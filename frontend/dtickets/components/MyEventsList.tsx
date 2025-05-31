"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, DollarSign, AlertTriangle, Plus, Loader2, Clock, Ticket } from "lucide-react"
import { formatUnixTimestamp } from "@/lib/utils"
import CreateEventModal from "./CreateEventModal"
import Image from "next/image"

interface CreatedEvent {
  id: string
  name: string
  dateTime: number
  venueName: string
  ticketPrice: number
  shortDescription: string
  totalTickets: number
  soldTickets: number
  remainingTickets: number
  totalRevenue: number
  status: "upcoming" | "ongoing" | "past"
  imageUrl?: string // Optional event image
}

interface MyEventsListProps {
  walletAddress: string | null
}

// Mock function to fetch events created by the user
const fetchMockCreatedEvents = async (address: string | null): Promise<CreatedEvent[]> => {
  if (!address) return []
  console.log(`Fetching created events for ${address}...`)
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const now = Math.floor(Date.now() / 1000)

  return [
    {
      id: "created1",
      name: "Sui Blockchain Summit",
      dateTime: now + 86400 * 7, // 7 days from now
      venueName: "Crypto Convention Center",
      ticketPrice: 25,
      shortDescription: "Deep dive into the Sui ecosystem.",
      totalTickets: 200,
      soldTickets: 113,
      remainingTickets: 87,
      totalRevenue: 113 * 25, // 2825 SUI
      status: "upcoming",
      imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
    },
    {
      id: "created2",
      name: "Web3 Gaming Workshop",
      dateTime: now + 86400 * 2, // 2 days from now
      venueName: "Innovation Hub",
      ticketPrice: 15,
      shortDescription: "Hands-on workshop for Web3 game development.",
      totalTickets: 50,
      soldTickets: 45,
      remainingTickets: 5,
      totalRevenue: 45 * 15, // 675 SUI
      status: "upcoming",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop",
    },
    {
      id: "created3",
      name: "DeFi Masterclass",
      dateTime: now - 86400 * 3, // 3 days ago (past event)
      venueName: "Financial District Center",
      ticketPrice: 30,
      shortDescription: "Advanced DeFi strategies and protocols.",
      totalTickets: 100,
      soldTickets: 100,
      remainingTickets: 0,
      totalRevenue: 100 * 30, // 3000 SUI
      status: "past",
      // No image for this event - will show background pattern
    },
    {
      id: "created4",
      name: "Community Meetup",
      dateTime: now + 86400 * 14, // 14 days from now
      venueName: "Local Co-working Space",
      ticketPrice: 5, // Changed from 0 to 5
      shortDescription: "Monthly community gathering.",
      totalTickets: 30,
      soldTickets: 18,
      remainingTickets: 12,
      totalRevenue: 18 * 5, // 90 SUI
      status: "upcoming",
      // No image for this event - will show background pattern
    },
  ]
}

export default function MyEventsList({ walletAddress }: MyEventsListProps) {
  const [events, setEvents] = useState<CreatedEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      setIsLoading(true)
      fetchMockCreatedEvents(walletAddress)
        .then(setEvents)
        .finally(() => setIsLoading(false))
    } else {
      setEvents([])
    }
  }, [walletAddress])

  const handleCreateEvent = async (eventData: any): Promise<boolean> => {
    console.log("Creating new event:", eventData)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate success and refresh events list
    const success = Math.random() > 0.2 // 80% success rate
    if (success && walletAddress) {
      // Refresh the events list
      fetchMockCreatedEvents(walletAddress).then(setEvents)
    }
    return success
  }

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p>Please connect your wallet to view your created events.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Your Events</h2>
        <p>Fetching your created events...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="h-12 w-12 text-sea mx-auto mb-4" />
        <p className="text-aqua text-lg mb-4">You haven't created any events yet.</p>
        <Button
          className="bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean transition-all duration-300"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Event
        </Button>
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateEvent={handleCreateEvent}
        />
      </div>
    )
  }

  const totalRevenue = events.reduce((sum, event) => sum + event.totalRevenue, 0)
  const upcomingEvents = events.filter((event) => event.status === "upcoming").length
  const pastEvents = events.filter((event) => event.status === "past").length

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sea">My Events</h1>
        <Button
          className="bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean transition-all duration-300"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Event
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua hover:border-2 transition-all duration-300 cursor-pointer hover:bg-ocean/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-sea">{totalRevenue} SUI</p>
              </div>
              <DollarSign className="h-8 w-8 text-sea" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua hover:border-2 transition-all duration-300 cursor-pointer hover:bg-ocean/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua text-sm">Upcoming Events</p>
                <p className="text-2xl font-bold text-sea">{upcomingEvents}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-sea" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua hover:border-2 transition-all duration-300 cursor-pointer hover:bg-ocean/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua text-sm">Past Events</p>
                <p className="text-2xl font-bold text-sea">{pastEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-sea" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => (
          <Card
            key={event.id}
            className="bg-ocean text-cloud border-sea overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua hover:border-2 transition-all duration-300 cursor-pointer group hover:bg-ocean/80"
          >
            {/* Event Image or Background */}
            {event.imageUrl ? (
              <div className="relative w-full h-32 overflow-hidden">
                <Image
                  src={event.imageUrl || "/placeholder.svg?height=128&width=400&query=event+banner"}
                  alt={event.name}
                  fill
                  className="object-cover transition-all duration-500 group-hover:brightness-110 group-hover:contrast-110"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean/60 to-transparent group-hover:from-ocean/40 transition-all duration-300" />
              </div>
            ) : (
              <div className="relative w-full h-32 bg-gradient-to-br from-sea/20 via-aqua/10 to-sea/30 overflow-hidden transition-all duration-500 group-hover:from-sea/40 group-hover:via-aqua/30 group-hover:to-sea/50">
                {/* Geometric pattern background */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <div className="absolute top-2 left-2 w-8 h-8 border border-sea/40 rounded-full group-hover:border-sea/80 transition-colors duration-300"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border border-aqua/40 rotate-45 group-hover:border-aqua/80 transition-colors duration-300"></div>
                  <div className="absolute bottom-3 left-4 w-4 h-4 bg-sea/30 rounded-full group-hover:bg-sea/60 transition-colors duration-300"></div>
                  <div className="absolute bottom-4 right-3 w-3 h-3 bg-aqua/30 rotate-45 group-hover:bg-aqua/60 transition-colors duration-300"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-sea/30 rounded-lg rotate-12 group-hover:border-sea/60 transition-colors duration-300"></div>
                </div>
                {/* Event type indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ticket className="h-8 w-8 text-sea/60 group-hover:text-sea transition-colors duration-300" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ocean/40 to-transparent" />
              </div>
            )}

            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-sea text-xl group-hover:text-aqua transition-colors duration-300">
                  {event.name}
                </CardTitle>
                <Badge
                  variant={event.status === "upcoming" ? "default" : event.status === "past" ? "secondary" : "outline"}
                  className={
                    event.status === "upcoming"
                      ? "bg-green-600 text-white"
                      : event.status === "past"
                        ? "bg-gray-600 text-white"
                        : "bg-blue-600 text-white"
                  }
                >
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
              <div className="text-aqua flex items-center text-sm group-hover:text-cloud transition-colors duration-300">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formatUnixTimestamp(event.dateTime)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                <MapPin className="mr-2 h-4 w-4" /> {event.venueName}
              </div>

              <p className="text-sm text-aqua line-clamp-2 group-hover:text-cloud transition-colors duration-300">
                {event.shortDescription}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-aqua group-hover:text-cloud transition-colors duration-300">Ticket Price</p>
                  <p className="text-cloud font-semibold group-hover:text-sea transition-colors duration-300">
                    {event.ticketPrice} SUI
                  </p>
                </div>
                <div>
                  <p className="text-aqua group-hover:text-cloud transition-colors duration-300">Revenue</p>
                  <p className="text-cloud font-semibold group-hover:text-sea transition-colors duration-300">
                    {event.totalRevenue} SUI
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-aqua group-hover:text-cloud transition-colors duration-300">Tickets Sold</span>
                  <span className="text-cloud group-hover:text-sea transition-colors duration-300">
                    {event.soldTickets}/{event.totalTickets}
                  </span>
                </div>
                <div className="w-full bg-deep-ocean rounded-full h-2">
                  <div
                    className="bg-sea h-2 rounded-full transition-all duration-300 group-hover:bg-aqua"
                    style={{ width: `${(event.soldTickets / event.totalTickets) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  )
}
