"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket, CalendarDays, MapPin, Tag, Users, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { formatUnixTimestamp } from "@/lib/utils"
import type { Event } from "./event-list"
import BuyTicketModal from "./buy-ticket-modal"
import ProcessingOverlay from "./processing-overlay"
import Image from "next/image"

interface EventCardProps {
  event: Event
  isWalletConnected: boolean
  walletAddress: string | null
  onBuyTicket: (eventId: string, recipients: string[]) => Promise<"success" | "failed" | "no_tickets">
}

export default function EventCard({ event, isWalletConnected, walletAddress, onBuyTicket }: EventCardProps) {
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "processing" | "success" | "failed" | "no_tickets">(
    "idle",
  )
  const [currentRemainingTickets, setCurrentRemainingTickets] = useState(event.remainingTickets)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Check if the event is in the past
  const isPastEvent = event.dateTime < Math.floor(Date.now() / 1000)

  const handleBuyTicketClick = () => {
    if (!isWalletConnected) {
      alert("Please connect your wallet first.")
      return
    }
    if (currentRemainingTickets === 0) {
      setPurchaseStatus("no_tickets")
      return
    }
    setIsBuyModalOpen(true)
  }

  const handlePurchase = async (recipients: string[]): Promise<"success" | "failed" | "no_tickets"> => {
    console.log(`Attempting to buy ${recipients.length} tickets for event: ${event.id}`)
    console.log("Recipients:", recipients)

    setIsProcessing(true)
    setPurchaseStatus("processing")

    try {
      const result = await onBuyTicket(event.id, recipients)
      setPurchaseStatus(result)

      if (result === "success") {
        setCurrentRemainingTickets((prev) => Math.max(0, prev - recipients.length))
      }

      return result
    } finally {
      setIsProcessing(false)
    }
  }

  const canBuy = currentRemainingTickets > 0

  return (
    <>
      <Card className="bg-ocean text-cloud border-sea flex flex-col h-full overflow-hidden">
        {/* Event Image or Background */}
        {event.imageUrl && !imageError ? (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={event.imageUrl || "/placeholder.svg"}
              alt={event.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/60 to-transparent" />
          </div>
        ) : (
          <div className="relative w-full h-48 bg-gradient-to-br from-sea/20 via-aqua/10 to-sea/30 overflow-hidden">
            {/* Geometric pattern background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-sea/40 rounded-full"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border-2 border-aqua/40 rotate-45"></div>
              <div className="absolute bottom-6 left-8 w-8 h-8 bg-sea/30 rounded-full"></div>
              <div className="absolute bottom-8 right-6 w-6 h-6 bg-aqua/30 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-sea/30 rounded-lg rotate-12"></div>
            </div>
            {/* Event type indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Ticket className="h-16 w-16 text-sea/60 mx-auto mb-2" />
                <p className="text-sea/80 font-semibold text-lg">{event.name}</p>
                <p className="text-aqua/60 text-sm">{event.venueName}</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/40 to-transparent" />
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-sea text-xl">{event.name}</CardTitle>
          <CardDescription className="text-aqua flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" /> {formatUnixTimestamp(event.dateTime)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <div className="flex items-center text-aqua">
            <MapPin className="mr-2 h-4 w-4" /> {event.venueName}
          </div>
          <p className="text-sm text-aqua line-clamp-3" title={event.shortDescription}>
            {event.shortDescription}
          </p>
          <div className="flex items-center text-aqua">
            <Tag className="mr-2 h-4 w-4" /> {event.ticketPrice} SUI
          </div>
          <div className="flex items-center text-aqua">
            <Users className="mr-2 h-4 w-4" /> {currentRemainingTickets}/{event.totalTickets} available
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch space-y-2">
          {purchaseStatus === "processing" && (
            <div className="flex items-center justify-center text-aqua">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </div>
          )}
          {purchaseStatus === "success" && (
            <div className="flex items-center justify-center text-green-400">
              <CheckCircle className="mr-2 h-4 w-4" /> Tickets Purchased!
            </div>
          )}
          {(purchaseStatus === "failed" || purchaseStatus === "no_tickets") && (
            <div className="flex items-center justify-center text-red-400">
              <AlertCircle className="mr-2 h-4 w-4" />
              {purchaseStatus === "failed" ? "Purchase Failed" : "No tickets left"}
            </div>
          )}
          {purchaseStatus !== "success" && (
            <Button
              onClick={handleBuyTicketClick}
              className="w-full bg-sea text-deep-ocean hover:bg-opacity-80 disabled:bg-gray-500"
              disabled={!canBuy || purchaseStatus === "processing" || !isWalletConnected || isPastEvent}
            >
              <Ticket className="mr-2 h-4 w-4" />
              {isWalletConnected
                ? isPastEvent
                  ? "Event Passed"
                  : canBuy
                    ? "Buy Ticket"
                    : "Sold Out"
                : "Connect Wallet to Buy"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <BuyTicketModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        eventName={event.name}
        ticketPrice={event.ticketPrice}
        remainingTickets={currentRemainingTickets}
        userWalletAddress={walletAddress || ""}
        onPurchase={handlePurchase}
      />

      <ProcessingOverlay
        isVisible={isProcessing}
        message="Processing your ticket purchase... Please confirm the transaction in your wallet."
      />
    </>
  )
}

// Default props for Next.js
EventCard.defaultProps = {
  event: {
    id: "0",
    name: "Default Event",
    dateTime: Math.floor(Date.now() / 1000) + 86400,
    venueName: "Default Venue",
    ticketPrice: 1,
    shortDescription: "This is a default event description.",
    remainingTickets: 10,
    totalTickets: 100,
  },
  isWalletConnected: false,
  walletAddress: null,
  onBuyTicket: async (eventId: string, recipients: string[]) => {
    console.log(`Buying tickets for ${eventId}, recipients:`, recipients)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return Math.random() > 0.3 ? "success" : "failed"
  },
}
