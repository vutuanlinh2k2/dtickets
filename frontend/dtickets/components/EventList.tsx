"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import EventCard from "./EventCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import { API_ENDPOINT } from "../constants";

// Original Event interface that EventCard expects
export interface Event {
  id: string;
  name: string;
  dateTime: number; // Unix timestamp
  venueName: string;
  ticketPrice: number; // in SUI (cannot be 0)
  shortDescription: string;
  remainingTickets: number;
  totalTickets: number;
  imageUrl?: string; // Optional event image
}

// API Event interface from backend
interface ApiEvent {
  id: string;
  name: string;
  description: string;
  venue: string;
  startTime: string;
  endTime: string;
  ticketPrice: string;
  totalTickets: number;
  ticketsSold: number;
  imgUrl?: string;
  organizer: string;
  createdAt: string;
  updatedAt: string;
  tickets: [];
}

interface EventListProps {
  initialEvents?: Event[];
}

export default function EventList({}: EventListProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "upcoming" | "past" | "ongoing"
  >("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  const { data: apiEvents, isLoading } = useQuery<ApiEvent[]>({
    queryKey: ["all events"],
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINT}/events`);
      return response.json();
    },
  });

  // Convert API events to the format EventCard expects
  const events: Event[] = useMemo(() => {
    if (!apiEvents) return [];

    return apiEvents.map((apiEvent) => ({
      id: apiEvent.id,
      name: apiEvent.name,
      dateTime: Math.floor(new Date(apiEvent.startTime).getTime() / 1000), // Convert to Unix timestamp
      venueName: apiEvent.venue,
      ticketPrice: parseFloat(apiEvent.ticketPrice),
      shortDescription: apiEvent.description,
      remainingTickets: apiEvent.totalTickets - apiEvent.ticketsSold,
      totalTickets: apiEvent.totalTickets,
      imageUrl: apiEvent.imgUrl || undefined,
    }));
  }, [apiEvents]);

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

  const filteredEvents = useMemo(() => {
    if (!events || !apiEvents) return [];

    let tempEvents = [...events];
    let tempApiEvents = [...apiEvents];

    // Date filter
    if (dateFilter === "upcoming") {
      tempApiEvents = tempApiEvents.filter(
        (event) => getEventStatus(event.startTime, event.endTime) === "upcoming"
      );
    } else if (dateFilter === "past") {
      tempApiEvents = tempApiEvents.filter(
        (event) => getEventStatus(event.startTime, event.endTime) === "past"
      );
    } else if (dateFilter === "ongoing") {
      tempApiEvents = tempApiEvents.filter(
        (event) => getEventStatus(event.startTime, event.endTime) === "ongoing"
      );
    }

    // Get the filtered event IDs
    const filteredIds = new Set(tempApiEvents.map((e) => e.id));
    tempEvents = tempEvents.filter((e) => filteredIds.has(e.id));

    // Price filter
    if (priceFilter !== "all") {
      tempEvents = tempEvents.filter((event) => {
        if (priceFilter === "0-10")
          return (
            event.ticketPrice > 0 &&
            event.ticketPrice <= 10 * 10 ** SUI_DECIMALS
          );
        if (priceFilter === "10-50")
          return (
            event.ticketPrice > 10 * 10 ** SUI_DECIMALS &&
            event.ticketPrice <= 50 * 10 ** SUI_DECIMALS
          );
        if (priceFilter === "50+") {
          return event.ticketPrice > 50 * 10 ** SUI_DECIMALS;
        }
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempEvents = tempEvents.filter(
        (event) =>
          event.name.toLowerCase().includes(lowerSearchTerm) ||
          event.venueName.toLowerCase().includes(lowerSearchTerm) ||
          event.shortDescription.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return tempEvents;
  }, [events, apiEvents, searchTerm, dateFilter, priceFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Events</h2>
        <p>Fetching available events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sea">Discover Events</h1>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search events by name, venue, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-ocean border-sea text-cloud focus:ring-sea w-full hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300"
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={dateFilter}
            onValueChange={(value: "all" | "upcoming" | "past" | "ongoing") =>
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
                value="ongoing"
                className="hover:bg-sea hover:text-deep-ocean"
              >
                Ongoing
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
            onValueChange={(value) => setPriceFilter(value)}
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
                0-10 SUI
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

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
          <Search className="h-12 w-12 text-sea mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Events Found</h2>
          <p>
            No events match your search criteria. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
