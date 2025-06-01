// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import express from "express";
import cors from "cors";
import { prisma } from "./db";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req: any, res: any) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all events
app.get("/api/events", async (req: any, res: any) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get tickets by owner
app.get("/api/tickets/owner/:address", async (req: any, res: any) => {
  try {
    const { address } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { owner: address },
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get events organized by a user
app.get("/api/events/organizer/:address", async (req: any, res: any) => {
  try {
    const { address } = req.params;
    const events = await prisma.event.findMany({
      where: { organizer: address },
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events by organizer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all available resale tickets
app.get("/api/resale-tickets", async (req: any, res: any) => {
  try {
    const resaleTickets = await prisma.resaleListing.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get additional details about the tickets and events
    const enrichedResaleTickets = await Promise.all(
      resaleTickets.map(async (listing) => {
        // Get the event details
        const event = await prisma.event.findUnique({
          where: { id: listing.eventId },
        });

        return {
          ...listing,
          event,
        };
      })
    );

    res.json(enrichedResaleTickets);
  } catch (error) {
    console.error("Error fetching resale tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get resale tickets by seller
app.get("/api/resale-tickets/seller/:address", async (req: any, res: any) => {
  try {
    const { address } = req.params;
    const resaleTickets = await prisma.resaleListing.findMany({
      where: {
        seller: address,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get additional details about the events
    const enrichedResaleTickets = await Promise.all(
      resaleTickets.map(async (listing) => {
        const event = await prisma.event.findUnique({
          where: { id: listing.eventId },
        });

        return {
          ...listing,
          event,
        };
      })
    );

    res.json(enrichedResaleTickets);
  } catch (error) {
    console.error("Error fetching seller's resale tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`dTickets API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/events - Get all events`);
  console.log(`  GET /api/tickets/owner/:address - Get tickets by owner`);
  console.log(`  GET /api/events/organizer/:address - Get events by organizer`);
  console.log(`  GET /api/resale-tickets - Get all available resale tickets`);
  console.log(
    `  GET /api/resale-tickets/event/:eventId - Get resale tickets for an event`
  );
  console.log(
    `  GET /api/resale-tickets/seller/:address - Get resale tickets by seller`
  );
});
