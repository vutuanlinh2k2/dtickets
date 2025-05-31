import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  createEvent,
  purchaseTicket,
  getCurrentTimestamp,
  requestSuiFromFaucet,
} from "./helpers/transaction-helpers";
import { prisma } from "./db";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function customTestFlow() {
  console.log("🚀 Starting Custom DTickets test flow...\n");

  try {
    // Create keypairs from provided private keys using the correct Sui SDK method
    const organizer = Ed25519Keypair.fromSecretKey(
      "suiprivkey1qqg3njq0q35jr3my2sw0340rgvufp74c3rg84yl4lysfh9wnncdg6xqequp"
    );
    const user1 = Ed25519Keypair.fromSecretKey(
      "suiprivkey1qrdma2rs3smn5azrndp42e5xc27v9upfw2tcv2mrllnxyt85nq5agka9pnd"
    );
    const user2 = Ed25519Keypair.fromSecretKey(
      "suiprivkey1qr5yrfpxmyaypx3nge3s2j9z36gjxjq3h0pauj0dyzcq8zzfhj5fxyl2t2m"
    );

    const organizerAddress = organizer.getPublicKey().toSuiAddress();
    const user1Address = user1.getPublicKey().toSuiAddress();
    const user2Address = user2.getPublicKey().toSuiAddress();

    console.log(`📋 Test Addresses:`);
    console.log(`   Organizer: ${organizerAddress}`);
    console.log(`   User1: ${user1Address}`);
    console.log(`   User2: ${user2Address}\n`);

    // Step 0: Ensure users have multiple coin objects by requesting from faucet
    console.log(
      "⛽ Requesting additional SUI from faucet for users to create multiple coin objects..."
    );
    try {
      await requestSuiFromFaucet(user1Address);
      console.log("✅ Additional SUI requested for User1");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait between requests
      await requestSuiFromFaucet(user2Address);
      console.log("✅ Additional SUI requested for User2");

      // Wait for faucet transactions to process
      console.log(
        "⏳ Waiting 10 seconds for faucet transactions to process..."
      );
      await delay(10000);
    } catch (error) {
      console.log(
        `⚠️ Faucet requests may have failed (this might be OK): ${error}`
      );
    }

    // Step 1: Create an event by organizer
    console.log("🎫 Organizer creating a test event...");
    const currentTime = getCurrentTimestamp();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const eventParams = {
      name: "Custom Test Concert 2024",
      description: "A custom test concert using provided private keys",
      venue: "Digital Test Arena",
      imgUrl: "https://example.com/test-concert.jpg",
      startTime: currentTime + oneDay, // Event starts in 1 day
      endTime: currentTime + oneDay + 4 * oneHour, // Event lasts 4 hours
      ticketPrice: 1000000000, // 1 SUI in MIST
      totalTickets: 100,
      keypair: organizer,
    };

    const eventResult = await createEvent(eventParams);
    console.log("✅ Event created successfully by organizer!");
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

    // Step 2: Wait for indexer to process
    console.log(
      "⏳ Waiting 5 seconds for indexer to process event creation..."
    );
    await delay(5000);

    // Step 3: User1 purchases a ticket for himself
    console.log("🎟️ User1 purchasing a ticket for himself...");
    const ticket1Result = await purchaseTicket({
      eventObjectId,
      ticketPrice: eventParams.ticketPrice,
      recipientAddress: user1Address,
      keypair: user1,
    });

    console.log("✅ Ticket 1 purchased successfully by User1 for himself!");
    console.log(`   Transaction: ${ticket1Result.digest}\n`);

    // Step 4: Wait for indexer to process
    console.log("⏳ Waiting 3 seconds for indexer to process...");
    await delay(3000);

    // Step 5: User1 purchases a ticket for User2
    console.log("🎟️ User1 purchasing a ticket for User2...");
    const ticket2Result = await purchaseTicket({
      eventObjectId,
      ticketPrice: eventParams.ticketPrice,
      recipientAddress: user2Address,
      keypair: user1,
    });

    console.log("✅ Ticket 2 purchased successfully by User1 for User2!");
    console.log(`   Transaction: ${ticket2Result.digest}\n`);

    // Step 6: Wait for final indexer processing
    console.log(
      "⏳ Waiting 5 seconds for indexer to process final ticket purchase..."
    );
    await delay(5000);

    // Step 7: Check database for results
    console.log("🔍 Checking database for indexed data...\n");

    // Check events in database
    const events = await prisma.event.findMany();
    console.log(`📊 Events in database: ${events.length}`);
    events.forEach((event, index) => {
      console.log(
        `   ${index + 1}. ${event.name} (${event.ticketsSold}/${event.totalTickets} tickets sold)`
      );
      console.log(`      Organizer: ${event.organizer}`);
      console.log(`      Venue: ${event.venue}`);
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
      console.log(`      Owner: ${ticket.owner}`);
      console.log(`      Ticket ID: ${ticket.id}`);
    });

    console.log("\n🎉 Custom test completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Organizer created 1 event`);
    console.log(`   - User1 purchased 2 tickets (1 for himself, 1 for User2)`);
    console.log(`   - Total tickets sold: ${tickets.length}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  customTestFlow().catch(console.error);
}

export { customTestFlow };
