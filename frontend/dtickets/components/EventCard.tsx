"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  CalendarDays,
  MapPin,
  Tag,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatUnixTimestamp } from "@/lib/utils";
import type { Event } from "./EventList";
import BuyTicketModal from "./BuyTicketModal";
import ProcessingOverlay from "./ProcessingOverlay";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatSuiAmount } from "../lib/formatSuiAmount";

interface EventCardProps {
  event: Event;
  isWalletConnected: boolean;
  walletAddress: string | null;
  onBuyTicket: (
    eventId: string,
    recipients: string[]
  ) => Promise<"success" | "failed" | "no_tickets">;
}

export default function EventCard({
  event,
  isWalletConnected,
  walletAddress,
  onBuyTicket,
}: EventCardProps) {
  const [purchaseStatus, setPurchaseStatus] = useState<
    "idle" | "processing" | "success" | "failed" | "no_tickets"
  >("idle");
  const [currentRemainingTickets, setCurrentRemainingTickets] = useState(
    event.remainingTickets
  );
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [displayedDate, setDisplayedDate] = useState<string | null>(null);
  const [clientDeterminedIsPastEvent, setClientDeterminedIsPastEvent] =
    useState(false);
  const [clientDeterminedIsOngoingEvent, setClientDeterminedIsOngoingEvent] =
    useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setDisplayedDate(formatUnixTimestamp(event.dateTime));
    const now = Math.floor(Date.now() / 1000);
    const eventDuration = 86400 * 2; // Assume events last 2 days

    setClientDeterminedIsPastEvent(event.dateTime + eventDuration < now);
    setClientDeterminedIsOngoingEvent(
      event.dateTime <= now && now < event.dateTime + eventDuration
    );
    setIsClientMounted(true);
  }, [event.dateTime]);

  // Use client-determined status only when client is mounted
  const isPastEvent = isClientMounted ? clientDeterminedIsPastEvent : false;
  const isOngoingEvent = isClientMounted
    ? clientDeterminedIsOngoingEvent
    : false;

  const getEventStatus = (): "upcoming" | "ongoing" | "past" => {
    if (isPastEvent) return "past";
    if (isOngoingEvent) return "ongoing";
    return "upcoming";
  };

  const handleBuyTicketClick = () => {
    if (!isWalletConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    if (currentRemainingTickets === 0) {
      setPurchaseStatus("no_tickets");
      return;
    }
    setIsBuyModalOpen(true);
  };

  const handlePurchase = async (
    recipients: string[]
  ): Promise<"success" | "failed" | "no_tickets"> => {
    console.log(
      `Attempting to buy ${recipients.length} tickets for event: ${event.id}`
    );
    console.log("Recipients:", recipients);

    setIsProcessing(true);
    setPurchaseStatus("processing");

    try {
      const result = await onBuyTicket(event.id, recipients);
      setPurchaseStatus(result);

      if (result === "success") {
        setCurrentRemainingTickets((prev) =>
          Math.max(0, prev - recipients.length)
        );
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const canBuy = currentRemainingTickets > 0;

  return (
    <>
      <Card className="bg-ocean text-cloud border-sea flex flex-col h-full overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua transition-all duration-300 cursor-pointer group hover:bg-ocean/80">
        {/* Event Image or Background */}
        {event.imageUrl && !imageError ? (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={
                event.imageUrl ||
                "/placeholder.svg?height=200&width=400&query=event+placeholder"
              }
              alt={event.name}
              fill
              className="object-cover transition-all duration-500 group-hover:brightness-110 group-hover:contrast-110"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean/60 to-transparent group-hover:from-ocean/40 transition-all duration-300" />
          </div>
        ) : (
          <div className="relative w-full h-48 bg-gradient-to-br from-sea/20 via-aqua/10 to-sea/30 overflow-hidden transition-all duration-500 group-hover:from-sea/40 group-hover:via-aqua/30 group-hover:to-sea/50">
            {/* Geometric pattern background */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-sea/40 rounded-full group-hover:border-sea/80 transition-colors duration-300"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border-2 border-aqua/40 rotate-45 group-hover:border-aqua/80 transition-colors duration-300"></div>
              <div className="absolute bottom-6 left-8 w-8 h-8 bg-sea/30 rounded-full group-hover:bg-sea/60 transition-colors duration-300"></div>
              <div className="absolute bottom-8 right-6 w-6 h-6 bg-aqua/30 rotate-45 group-hover:bg-aqua/60 transition-colors duration-300"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-sea/30 rounded-lg rotate-12 group-hover:border-sea/60 transition-colors duration-300"></div>
            </div>
            {/* Event type indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Ticket className="h-16 w-16 text-sea/60 mx-auto mb-2 group-hover:text-sea transition-colors duration-300" />
                <p className="text-sea/80 font-semibold text-lg group-hover:text-sea transition-colors duration-300">
                  {event.name}
                </p>
                <p className="text-aqua/60 text-sm group-hover:text-aqua transition-colors duration-300">
                  {event.venueName}
                </p>
              </div>
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
              variant={
                getEventStatus() === "upcoming"
                  ? "default"
                  : getEventStatus() === "ongoing"
                    ? "secondary"
                    : "destructive"
              }
              className={
                getEventStatus() === "past"
                  ? "bg-gray-600 text-white"
                  : getEventStatus() === "ongoing"
                    ? "bg-yellow-600 text-white"
                    : "bg-green-600 text-white"
              }
            >
              {getEventStatus().charAt(0).toUpperCase() +
                getEventStatus().slice(1)}
            </Badge>
          </div>
          <CardDescription className="text-aqua flex items-center group-hover:text-cloud transition-colors duration-300">
            <CalendarDays className="mr-2 h-4 w-4" />{" "}
            {displayedDate || "Loading date..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
            <MapPin className="mr-2 h-4 w-4" /> {event.venueName}
          </div>
          <p
            className="text-sm text-aqua line-clamp-3 group-hover:text-cloud transition-colors duration-300"
            title={event.shortDescription}
          >
            {event.shortDescription}
          </p>
          <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
            <Tag className="mr-2 h-4 w-4" /> {formatSuiAmount(event.ticketPrice.toString())} SUI
          </div>
          <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
            <Users className="mr-2 h-4 w-4" /> {currentRemainingTickets}/
            {event.totalTickets} available
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
              {purchaseStatus === "failed"
                ? "Purchase Failed"
                : "No tickets left"}
            </div>
          )}
          {purchaseStatus !== "success" && (
            <Button
              onClick={handleBuyTicketClick}
              className="w-full bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:bg-gray-500 transition-all duration-300"
              disabled={
                !canBuy ||
                purchaseStatus === "processing" ||
                !isWalletConnected ||
                getEventStatus() === "past"
              }
            >
              <Ticket className="mr-2 h-4 w-4" />
              {isWalletConnected
                ? getEventStatus() === "past"
                  ? "Event Passed"
                  : canBuy
                    ? getEventStatus() === "ongoing"
                      ? "Buy Ticket (Live)"
                      : "Buy Ticket"
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
  );
}
