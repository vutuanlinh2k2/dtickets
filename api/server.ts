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

// Start server
app.listen(PORT, () => {
  console.log(`dTickets API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
