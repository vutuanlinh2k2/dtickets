// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
  createEvent,
  purchaseTicket,
  requestSuiFromFaucet,
  getTestKeypair,
  getCurrentTimestamp,
} from "./helpers/transaction-helpers";
import { prisma } from "./db";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testFullFlow() {
  console.log("🚀 Starting DTickets test flow...\n");

  // Create test keypairs
  const organizer = getTestKeypair();
  const buyer = getTestKeypair();

  const organizerAddress = organizer.getPublicKey().toSuiAddress();
  const buyerAddress = buyer.getPublicKey().toSuiAddress();

  console.log(`📋 Test Addresses:`);
  console.log(`   Organizer: ${organizerAddress}`);
  console.log(`   Buyer: ${buyerAddress}\n`);

  try {
    // Step 1: Request SUI from faucet for both accounts
    console.log("💰 Requesting SUI from faucet...");
    await requestSuiFromFaucet(organizerAddress);
    await delay(1000); // Wait a bit between faucet requests
    await requestSuiFromFaucet(buyerAddress);

    console.log("✅ Faucet requests completed\n");

    // Wait for faucet to process
    console.log("⏳ Waiting 10 seconds for faucet to process...");
    await delay(10000);

    // Step 2: Create an event
    console.log("🎫 Creating a test event...");
    const currentTime = getCurrentTimestamp();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const eventParams = {
      name: "Test Concert 2024",
      description: "An amazing test concert for the DTickets platform",
      venue: "Digital Arena",
      imgUrl: "https://example.com/concert.jpg",
      startTime: currentTime + oneDay, // Event starts in 1 day
      endTime: currentTime + oneDay + 4 * oneHour, // Event lasts 4 hours
      ticketPrice: 1000000000, // 1 SUI in MIST
      totalTickets: 100,
      keypair: organizer,
    };

    const eventResult = await createEvent(eventParams);
    console.log("✅ Event created successfully!");
    console.log(`   Transaction: ${eventResult.digest}\n`);

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

    // Step 3: Wait a bit for the indexer to process
    console.log(
      "⏳ Waiting 5 seconds for indexer to process event creation..."
    );
    await delay(5000);

    // Step 4: Purchase a ticket
    console.log("🎟️ Purchasing a ticket...");
    const ticketResult = await purchaseTicket({
      eventObjectId,
      ticketPrice: eventParams.ticketPrice,
      keypair: buyer,
    });

    console.log("✅ Ticket purchased successfully!");
    console.log(`   Transaction: ${ticketResult.digest}\n`);

    // Step 5: Wait for indexer to process ticket purchase
    console.log(
      "⏳ Waiting 5 seconds for indexer to process ticket purchase..."
    );
    await delay(5000);

    // Step 6: Check database for results
    console.log("🔍 Checking database for indexed data...\n");

    // Check events in database
    const events = await prisma.event.findMany();
    console.log(`📊 Events in database: ${events.length}`);
    events.forEach((event, index) => {
      console.log(
        `   ${index + 1}. ${event.name} (${event.ticketsSold}/${event.totalTickets} tickets sold)`
      );
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
        `   ${index + 1}. Ticket #${ticket.ticketNumber} for "${ticket.event.name}" owned by ${ticket.owner}`
      );
    });

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFullFlow().catch(console.error);
}

export { testFullFlow };
