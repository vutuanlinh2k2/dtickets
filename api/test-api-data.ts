// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { prisma } from "./db";

async function testAPIData() {
  console.log("🔍 Testing API Data Retrieval...\n");

  try {
    // Simulate GET /api/events
    console.log("📡 GET /api/events");
    const events = await prisma.event.findMany({
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name}`);
      console.log(`      - ID: ${event.id}`);
      console.log(`      - Organizer: ${event.organizer}`);
      console.log(`      - Venue: ${event.venue}`);
      console.log(
        `      - Price: ${event.ticketPrice} MIST (${Number(event.ticketPrice) / 1000000000} SUI)`
      );
      console.log(
        `      - Tickets: ${event.ticketsSold}/${event.totalTickets} sold`
      );
      console.log(`      - Start: ${event.startTime}`);
      console.log(`      - End: ${event.endTime}`);
      console.log(`      - Created: ${event.createdAt}`);
      console.log(`      - Tickets loaded: ${event.tickets.length}\n`);
    });

    if (events.length > 0) {
      const firstEvent = events[0];

      // Simulate GET /api/events/:id
      console.log(`📡 GET /api/events/${firstEvent.id}`);
      const eventDetail = await prisma.event.findUnique({
        where: { id: firstEvent.id },
        include: {
          tickets: true,
        },
      });

      if (eventDetail) {
        console.log(`✅ Event details for "${eventDetail.name}":`);
        console.log(`   - Description: ${eventDetail.description}`);
        console.log(`   - Image URL: ${eventDetail.imgUrl}`);
        console.log(
          `   - Total revenue: ${Number(eventDetail.ticketPrice) * eventDetail.ticketsSold} MIST`
        );
        console.log(`   - Tickets attached: ${eventDetail.tickets.length}\n`);
      }

      // Simulate GET /api/events/:id/tickets
      console.log(`📡 GET /api/events/${firstEvent.id}/tickets`);
      const eventTickets = await prisma.ticket.findMany({
        where: { eventId: firstEvent.id },
        include: {
          event: true,
        },
        orderBy: {
          ticketNumber: "asc",
        },
      });

      console.log(`✅ Found ${eventTickets.length} tickets for this event:`);
      eventTickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. Ticket #${ticket.ticketNumber}`);
        console.log(`      - ID: ${ticket.id}`);
        console.log(`      - Owner: ${ticket.owner}`);
        console.log(`      - Created: ${ticket.createdAt}\n`);
      });

      // Simulate GET /api/tickets/owner/:address
      if (eventTickets.length > 0) {
        const ownerAddress = eventTickets[0].owner;
        console.log(`📡 GET /api/tickets/owner/${ownerAddress}`);
        const ownerTickets = await prisma.ticket.findMany({
          where: { owner: ownerAddress },
          include: {
            event: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        console.log(
          `✅ Found ${ownerTickets.length} tickets owned by ${ownerAddress}:`
        );
        ownerTickets.forEach((ticket, index) => {
          console.log(
            `   ${index + 1}. Ticket #${ticket.ticketNumber} for "${ticket.event.name}"`
          );
          console.log(`      - Event: ${ticket.event.venue}`);
          console.log(`      - Event Date: ${ticket.event.startTime}`);
          console.log(`      - Purchased: ${ticket.createdAt}\n`);
        });
      }
    }

    // Show indexer cursor status
    console.log("📡 GET /api/indexer/status (custom endpoint)");
    const cursors = await prisma.cursor.findMany();
    console.log(`✅ Indexer status: ${cursors.length} trackers active`);
    cursors.forEach((cursor, index) => {
      console.log(`   ${index + 1}. ${cursor.id.split("::").pop()}`);
      console.log(`      - Last TX: ${cursor.txDigest}`);
      console.log(`      - Last Event Seq: ${cursor.eventSeq}\n`);
    });

    console.log("🎉 API Data Test Complete!");
    console.log("\n📊 Summary:");
    console.log(`   - Events available via API: ${events.length}`);
    console.log(
      `   - Total tickets in system: ${events.reduce((sum, e) => sum + e.tickets.length, 0)}`
    );
    console.log(
      `   - Indexer tracking: ${cursors.length > 0 ? "Active" : "Inactive"}`
    );
    console.log(
      `   - Database: ${events.length > 0 ? "Populated with real data" : "Empty"}`
    );
  } catch (error) {
    console.error("❌ API Data test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAPIData().catch(console.error);
}

export { testAPIData };
