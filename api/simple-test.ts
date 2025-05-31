// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import {
  createEvent,
  purchaseTicket,
  getCurrentTimestamp,
} from "./helpers/transaction-helpers";
import { prisma } from "./db";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function simpleTest() {
  console.log("🚀 Starting simple DTickets test...\n");

  // Use existing funded account
  const privateKeyBytes = decodeSuiPrivateKey(
    "suiprivkey1qqg3njq0q35jr3my2sw0340rgvufp74c3rg84yl4lysfh9wnncdg6xqequp"
  ).secretKey;
  const organizer = Ed25519Keypair.fromSecretKey(privateKeyBytes);
  const buyer = organizer; // Use same account for both organizer and buyer for simplicity

  const organizerAddress = organizer.getPublicKey().toSuiAddress();

  console.log(`📋 Using Address: ${organizerAddress}\n`);

  try {
    // Step 1: Create an event
    console.log("🎫 Creating a test event...");
    const currentTime = getCurrentTimestamp();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const eventParams = {
      name: "Simple Test Event",
      description: "A simple test event for DTickets",
      venue: "Test Venue",
      imgUrl: "https://example.com/event.jpg",
      startTime: currentTime + oneDay, // Event starts in 1 day
      endTime: currentTime + oneDay + 2 * oneHour, // Event lasts 2 hours
      ticketPrice: 100000000, // 0.1 SUI in MIST
      totalTickets: 10,
      keypair: organizer,
    };

    const eventResult = await createEvent(eventParams);
    console.log("✅ Event created successfully!");
    console.log(`   Transaction: ${eventResult.digest}`);

    // Extract event object ID from the transaction result
    let eventObjectId: string | null = null;
    if (eventResult.objectChanges) {
      for (const change of eventResult.objectChanges) {
        if (
          change.type === "created" &&
          change.objectType?.includes("::dtickets::Event")
        ) {
          eventObjectId = change.objectId;
          break;
        }
      }
    }

    if (!eventObjectId) {
      throw new Error("Could not find event object ID in transaction result");
    }

    console.log(`🆔 Event Object ID: ${eventObjectId}\n`);

    // Step 2: Wait for indexer to process
    console.log("⏳ Waiting 8 seconds for indexer to process...");
    await delay(8000);

    // Step 3: Purchase a ticket
    console.log("🎟️ Purchasing a ticket...");
    const ticketResult = await purchaseTicket({
      eventObjectId,
      ticketPrice: eventParams.ticketPrice,
      keypair: buyer,
    });

    console.log("✅ Ticket purchased successfully!");
    console.log(`   Transaction: ${ticketResult.digest}\n`);

    // Step 4: Wait for indexer to process ticket purchase
    console.log("⏳ Waiting 8 seconds for indexer to process...");
    await delay(8000);

    // Step 5: Check database for results
    console.log("🔍 Checking database for indexed data...\n");

    // Check events in database
    const events = await prisma.event.findMany();
    console.log(`📊 Events in database: ${events.length}`);
    events.forEach((event, index) => {
      console.log(
        `   ${index + 1}. ${event.name} (${event.ticketsSold}/${event.totalTickets} tickets sold)`
      );
      console.log(`      - Organizer: ${event.organizer}`);
      console.log(`      - Price: ${event.ticketPrice} MIST`);
      console.log(`      - Venue: ${event.venue}`);
    });

    // Check tickets in database
    const tickets = await prisma.ticket.findMany({
      include: {
        event: true,
      },
    });
    console.log(`\n🎫 Tickets in database: ${tickets.length}`);
    tickets.forEach((ticket, index) => {
      console.log(
        `   ${index + 1}. Ticket #${ticket.ticketNumber} for "${ticket.event.name}"`
      );
      console.log(`      - Owner: ${ticket.owner}`);
      console.log(`      - Created: ${ticket.createdAt}`);
    });

    // Check cursors to see indexer progress
    const cursors = await prisma.cursor.findMany();
    console.log(`\n📍 Indexer cursors: ${cursors.length}`);
    cursors.forEach((cursor, index) => {
      console.log(
        `   ${index + 1}. ${cursor.id}: tx ${cursor.txDigest}, event ${cursor.eventSeq}`
      );
    });

    console.log("\n🎉 Test completed successfully!");
    console.log("\n📈 Summary:");
    console.log(`   - Events created and indexed: ${events.length}`);
    console.log(`   - Tickets purchased and indexed: ${tickets.length}`);
    console.log(
      `   - Indexer is ${cursors.length > 0 ? "working" : "not tracking events yet"}`
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  simpleTest().catch(console.error);
}

export { simpleTest };
