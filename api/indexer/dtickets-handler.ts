// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { SuiEvent } from "@mysten/sui/client";

import { prisma } from "../db";

type EventCreated = {
  event_id: string;
  name: string;
  start_time: string;
  end_time: string;
  venue: string;
  organizer: string;
  ticket_price: string;
  total_tickets: string;
  imgUrl: string;
};

type TicketPurchased = {
  ticket_id: string;
  event_id: string;
  buyer: string;
  recipient: string;
  price: string;
  ticket_number: string;
};

/**
 * Handles all events emitted by the `dtickets` module.
 * Data is modelled in a way that allows writing to the db in any order (DESC or ASC) without
 * resulting in data inconsistencies.
 * We're constructing the updates to support multiple events involving a single record
 * as part of the same batch of events (but using a single write/record to the DB).
 */
export const handleDTicketsEvents = async (
  events: SuiEvent[],
  type: string
) => {
  const eventUpdates: Record<string, any> = {};
  const ticketUpdates: Record<string, any> = {};

  for (const event of events) {
    if (!event.type.startsWith(type))
      throw new Error("Invalid event module origin");

    // Handle EventCreated
    if (event.type.endsWith("::EventCreated")) {
      const data = event.parsedJson as EventCreated;

      // Convert timestamps from string to Date objects
      const startTime = new Date(parseInt(data.start_time));
      const endTime = new Date(parseInt(data.end_time));

      if (!Object.hasOwn(eventUpdates, data.event_id)) {
        eventUpdates[data.event_id] = {
          id: data.event_id,
          name: data.name,
          description: "", // Will be updated if we get more data
          venue: data.venue,
          organizer: data.organizer,
          imgUrl: data.imgUrl,
          startTime,
          endTime,
          ticketPrice: data.ticket_price,
          totalTickets: parseInt(data.total_tickets),
          ticketsSold: 0, // Will be updated as tickets are purchased
        };
      }

      // Update existing event data
      eventUpdates[data.event_id].name = data.name;
      eventUpdates[data.event_id].venue = data.venue;
      eventUpdates[data.event_id].organizer = data.organizer;
      eventUpdates[data.event_id].startTime = startTime;
      eventUpdates[data.event_id].endTime = endTime;
      eventUpdates[data.event_id].ticketPrice = data.ticket_price;
      eventUpdates[data.event_id].totalTickets = parseInt(data.total_tickets);

      continue;
    }

    // Handle TicketPurchased
    if (event.type.endsWith("::TicketPurchased")) {
      const data = event.parsedJson as TicketPurchased;

      if (!Object.hasOwn(ticketUpdates, data.ticket_id)) {
        ticketUpdates[data.ticket_id] = {
          id: data.ticket_id,
          eventId: data.event_id,
          ticketNumber: parseInt(data.ticket_number),
          owner: data.recipient,
        };
      }

      // Update ticket data
      ticketUpdates[data.ticket_id].eventId = data.event_id;
      ticketUpdates[data.ticket_id].ticketNumber = parseInt(data.ticket_number);
      ticketUpdates[data.ticket_id].owner = data.recipient;

      continue;
    }
  }

  // Process event updates
  if (Object.keys(eventUpdates).length > 0) {
    const eventPromises = Object.values(eventUpdates).map((update) =>
      prisma.event.upsert({
        where: {
          id: update.id,
        },
        create: update,
        update: {
          name: update.name,
          venue: update.venue,
          organizer: update.organizer,
          startTime: update.startTime,
          endTime: update.endTime,
          ticketPrice: update.ticketPrice,
          totalTickets: update.totalTickets,
        },
      })
    );

    await Promise.all(eventPromises);
    console.log(`Processed ${Object.keys(eventUpdates).length} event updates`);
  }

  // Process ticket updates and update event ticket counts
  if (Object.keys(ticketUpdates).length > 0) {
    const ticketPromises = Object.values(ticketUpdates).map((update) =>
      prisma.ticket.upsert({
        where: {
          id: update.id,
        },
        create: update,
        update: {
          owner: update.owner,
        },
      })
    );

    await Promise.all(ticketPromises);

    // Update tickets sold count for affected events
    const affectedEventIds = [
      ...new Set(Object.values(ticketUpdates).map((t) => t.eventId)),
    ];

    for (const eventId of affectedEventIds) {
      const ticketCount = await prisma.ticket.count({
        where: { eventId },
      });

      await prisma.event.update({
        where: { id: eventId },
        data: { ticketsSold: ticketCount },
      });
    }

    console.log(
      `Processed ${Object.keys(ticketUpdates).length} ticket updates`
    );
  }
};
