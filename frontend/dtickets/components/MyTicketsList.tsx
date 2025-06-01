"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TicketIcon,
  AlertTriangle,
  CalendarDays,
  MapPin,
  Loader2,
  Coins,
} from "lucide-react";
import Image from "next/image";
import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../constants";
import { formatDateString } from "@/lib/utils";
import type { Ticket } from "../types";
import ResellTicketModal from "./ResellTicketModal";
import { useCreateEventMutation } from "../mutations/resellTicket";

export default function MyTicketsList() {
  const { isConnecting } = useCurrentWallet();
  const account = useCurrentAccount();
  const walletAddress = account?.address;
  const [isResellModalOpen, setIsResellModalOpen] = useState(false);
  const [selectedTicketToResell, setSelectedTicketToResell] =
    useState<Ticket | null>(null);

  const resellMutation = useCreateEventMutation();

  const { data, isLoading } = useQuery({
    queryKey: [QueryKey.MyTickets],
    queryFn: async () => {
      const data = await fetch(
        `http://localhost:3001/api/tickets/owner/${walletAddress}`
      );
      return data.json();
    },
    enabled: !!walletAddress,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets: Ticket[] = (data ?? []).map((ticket: any) => ({
    id: ticket.id,
    eventId: ticket.eventId,
    eventName: ticket.event.name,
    eventStartTime: ticket.event.startTime,
    eventEndTime: ticket.event.endTime,
    venue: ticket.event.venue,
    ticketNumber: ticket.ticketNumber,
    purchaseTime: ticket.createdAt,
    imageUrl: ticket.event.imageUrl,
    isListedForSale: ticket.isListedForSale,
    purchaseAmount: ticket.event.ticketPrice,
  }));

  const handleResellClick = (ticket: Ticket) => {
    setSelectedTicketToResell(ticket);
    setIsResellModalOpen(true);
  };

  const handleCloseResellModal = () => {
    setIsResellModalOpen(false);
    setSelectedTicketToResell(null);
  };

  const handleConfirmResell = async (
    resalePrice: number
  ): Promise<"success" | "failed" | "invalid_price"> => {
    if (!selectedTicketToResell) return "failed";

    try {
      await resellMutation.mutateAsync({
        ticketData: selectedTicketToResell,
        resalePrice: resalePrice,
      });
      return "success";
    } catch (error) {
      console.error("Failed to resell ticket:", error);
      return "failed";
    }
  };

  if (!isConnecting && !walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p>Please connect your wallet to view your tickets.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Your Tickets</h2>
        <p>Fetching your ticket collection...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <TicketIcon className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
        <p>
          You don&apos;t own any tickets yet. Start by purchasing tickets to
          upcoming events!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-sea mb-6">My Tickets</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="bg-ocean text-cloud border-sea overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua transition-all duration-300 cursor-pointer group hover:bg-ocean/80"
          >
            {/* Event Image or Background */}
            {ticket.imageUrl ? (
              <div className="relative w-full h-32 overflow-hidden">
                <Image
                  src={ticket.imageUrl || "/placeholder.svg"}
                  alt={ticket.eventName}
                  fill
                  className="object-cover transition-all duration-500 group-hover:brightness-110 group-hover:contrast-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  <TicketIcon className="h-8 w-8 text-sea/60 group-hover:text-sea transition-colors duration-300" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ocean/40 to-transparent" />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-sea flex items-center group-hover:text-aqua transition-colors duration-300">
                  <TicketIcon className="mr-2 h-5 w-5" />
                  {ticket.eventName}
                </CardTitle>
                <div className="flex flex-col items-end">
                  <Badge
                    variant={
                      getEventStatus(
                        ticket.eventStartTime,
                        ticket.eventEndTime
                      ) === "upcoming"
                        ? "default"
                        : getEventStatus(
                              ticket.eventStartTime,
                              ticket.eventEndTime
                            ) === "ongoing"
                          ? "secondary"
                          : "destructive"
                    }
                    className={
                      getEventStatus(
                        ticket.eventStartTime,
                        ticket.eventEndTime
                      ) === "upcoming"
                        ? "bg-green-600 text-white"
                        : getEventStatus(
                              ticket.eventStartTime,
                              ticket.eventEndTime
                            ) === "ongoing"
                          ? "bg-yellow-600 text-white"
                          : "bg-gray-600 text-white"
                    }
                  >
                    {getEventStatus(
                      ticket.eventStartTime,
                      ticket.eventEndTime
                    ) === "upcoming"
                      ? "Upcoming"
                      : getEventStatus(
                            ticket.eventStartTime,
                            ticket.eventEndTime
                          ) === "ongoing"
                        ? "Ongoing"
                        : "Past"}
                  </Badge>
                  {getEventStatus(
                    ticket.eventStartTime,
                    ticket.eventEndTime
                  ) === "upcoming" &&
                    !ticket.isListedForSale && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-sea text-aqua hover:bg-sea hover:text-deep-ocean"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResellClick(ticket);
                        }}
                      >
                        Resell Ticket
                      </Button>
                    )}
                  {ticket.isListedForSale && (
                    <Badge className="mt-2 bg-blue-600 text-white hover:bg-blue-600">
                      Listed for Sale{" "}
                      <Coins className="inline-block h-4 w-4 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formatDateString(ticket.eventStartTime)} -{" "}
                {formatDateString(ticket.eventEndTime)}
              </div>
              <div className="flex items-center text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                <MapPin className="mr-2 h-4 w-4" />
                {ticket.venue}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                    Ticket ID:
                  </span>
                  <span className="text-cloud font-mono text-sm group-hover:text-sea transition-colors duration-300">
                    {ticket.ticketNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                  Purchased At:
                </p>
                <p className="text-cloud text-sm group-hover:text-sea transition-colors duration-300">
                  {formatDateString(ticket.purchaseTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicketToResell && (
        <ResellTicketModal
          isOpen={isResellModalOpen}
          onClose={handleCloseResellModal}
          ticket={selectedTicketToResell}
          onConfirmResell={handleConfirmResell}
        />
      )}
    </div>
  );
}

const getEventStatus = (
  startTime: string,
  endTime: string
): "upcoming" | "ongoing" | "past" => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "past";
};
