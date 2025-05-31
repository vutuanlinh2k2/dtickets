"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MapPin,
  DollarSign,
  AlertTriangle,
  Plus,
  Loader2,
  Clock,
  Ticket,
} from "lucide-react";
import { formatDateString } from "@/lib/utils";
import CreateEventModal from "./CreateEventModal";
import Image from "next/image";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { EventCreationData, Event } from "../types";
import { useCreateEventMutation } from "../mutations/createEvent";
import { formatSuiAmount } from "../utils/formatSuiAmount";
import { BigNumber } from "bignumber.js";

export default function MyEventsList() {
  const account = useCurrentAccount();
  const walletAddress = account?.address;
  const { mutate: createEvent } = useCreateEventMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["events created by user"],
    queryFn: async () => {
      const data = await fetch(
        `http://localhost:3001/api/events/organizer/${walletAddress}`
      );
      return data.json();
    },
    enabled: !!walletAddress,
  });

  const handleCreateEvent = async (
    eventData: EventCreationData
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      createEvent(eventData, {
        onSuccess: () => resolve(true),
        onError: () => resolve(false),
      });
    });
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p>Please connect your wallet to view your created events.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Your Events</h2>
        <p>Fetching your created events...</p>
      </div>
    );
  }

  if (events && events.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="h-12 w-12 text-sea mx-auto mb-4" />
        <p className="text-aqua text-lg mb-4">
          You haven&apos;t created any events yet.
        </p>
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
          onCreateEvent={handleCreateEvent} // TODO: fix this
        />
      </div>
    );
  }

  const totalRevenue = (events ?? []).reduce(
    (sum, event) =>
      sum.plus(BigNumber(event.ticketPrice).multipliedBy(event.ticketsSold)),
    BigNumber(0)
  );

  const upcomingEvents = (events ?? []).filter(
    (event) => getEventStatus(event.startTime, event.endTime) === "upcoming"
  ).length;
  const ongoingEvents = (events ?? []).filter(
    (event) => getEventStatus(event.startTime, event.endTime) === "ongoing"
  ).length;
  const pastEvents = (events ?? []).filter(
    (event) => getEventStatus(event.startTime, event.endTime) === "past"
  ).length;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua  transition-all duration-300 cursor-pointer hover:bg-ocean/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-sea">
                  {formatSuiAmount(totalRevenue)} SUI
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-sea" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua  transition-all duration-300 cursor-pointer hover:bg-ocean/80">
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

        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua  transition-all duration-300 cursor-pointer hover:bg-ocean/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-aqua text-sm">Ongoing Events</p>
                <p className="text-2xl font-bold text-sea">{ongoingEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-sea" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean border-sea hover:shadow-xl hover:shadow-sea/20 hover:border-aqua  transition-all duration-300 cursor-pointer hover:bg-ocean/80">
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
        {(events ?? []).map((event) => (
          <Card
            key={event.id}
            className="bg-ocean text-cloud border-sea overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua  transition-all duration-300 cursor-pointer group hover:bg-ocean/80"
          >
            {/* Event Image or Background */}
            {event.imgUrl ? (
              <div className="relative w-full h-32 overflow-hidden">
                <Image
                  src={
                    event.imgUrl ||
                    "/placeholder.svg?height=128&width=400&query=event+banner"
                  }
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
                  variant={
                    getEventStatus(event.startTime, event.endTime) ===
                    "upcoming"
                      ? "default"
                      : getEventStatus(event.startTime, event.endTime) ===
                          "past"
                        ? "secondary"
                        : "outline"
                  }
                  className={
                    getEventStatus(event.startTime, event.endTime) ===
                    "upcoming"
                      ? "bg-green-600 text-white"
                      : getEventStatus(event.startTime, event.endTime) ===
                          "past"
                        ? "bg-gray-600 text-white"
                        : "bg-yellow-600 text-white"
                  }
                >
                  {getEventStatus(event.startTime, event.endTime)
                    .charAt(0)
                    .toUpperCase() +
                    getEventStatus(event.startTime, event.endTime).slice(1)}
                </Badge>
              </div>
              <div className="text-aqua flex items-center text-sm group-hover:text-cloud transition-colors duration-300">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formatDateString(event.startTime)} -{" "}
                {formatDateString(event.endTime)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-aqua text-sm group-hover:text-cloud transition-colors duration-300">
                <MapPin className="mr-2 h-4 w-4" /> {event.venue}
              </div>

              <p className="text-sm text-aqua line-clamp-2 group-hover:text-cloud transition-colors duration-300">
                {event.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-aqua group-hover:text-cloud transition-colors duration-300">
                    Ticket Price
                  </p>
                  <p className="text-cloud font-semibold group-hover:text-sea transition-colors duration-300">
                    {formatSuiAmount(event.ticketPrice)} SUI
                  </p>
                </div>
                <div>
                  <p className="text-aqua group-hover:text-cloud transition-colors duration-300">
                    Revenue
                  </p>
                  <p className="text-cloud font-semibold group-hover:text-sea transition-colors duration-300">
                    {formatSuiAmount(
                      BigNumber(event.ticketPrice).multipliedBy(
                        event.ticketsSold
                      )
                    )}{" "}
                    SUI
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-aqua group-hover:text-cloud transition-colors duration-300">
                    Tickets Sold
                  </span>
                  <span className="text-cloud group-hover:text-sea transition-colors duration-300">
                    {event.ticketsSold}/{event.totalTickets}
                  </span>
                </div>
                <div className="w-full bg-deep-ocean rounded-full h-2">
                  <div
                    className="bg-sea h-2 rounded-full transition-all duration-300 group-hover:bg-aqua"
                    style={{
                      width: `${(event.ticketsSold / event.totalTickets) * 100}%`,
                    }}
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
