import { prisma } from "./db";

async function checkDatabaseState() {
  console.log("🔍 Checking Database State...\n");

  try {
    // Check events in database
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Events in database: ${events.length}`);
    if (events.length > 0) {
      events.forEach((event, index) => {
        console.log(`\n   ${index + 1}. ${event.name}`);
        console.log(`      ID: ${event.id}`);
        console.log(`      Organizer: ${event.organizer}`);
        console.log(`      Venue: ${event.venue}`);
        console.log(
          `      Tickets Sold: ${event.ticketsSold}/${event.totalTickets}`
        );
        console.log(`      Price: ${event.ticketPrice} MIST`);
        console.log(`      Created: ${event.createdAt}`);
      });
    } else {
      console.log("   No events found in database");
    }

    // Check tickets in database
    const tickets = await prisma.ticket.findMany({
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`\n🎫 Tickets in database: ${tickets.length}`);
    if (tickets.length > 0) {
      tickets.forEach((ticket, index) => {
        console.log(`\n   ${index + 1}. Ticket #${ticket.ticketNumber}`);
        console.log(`      Event: ${ticket.event.name}`);
        console.log(`      Owner: ${ticket.owner}`);
        console.log(`      Ticket ID: ${ticket.id}`);
        console.log(`      Created: ${ticket.createdAt}`);
      });
    } else {
      console.log("   No tickets found in database");
    }

    // Check resale listings in database
    const resaleListings = await prisma.resaleListing.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`\n💰 Resale Listings in database: ${resaleListings.length}`);
    if (resaleListings.length > 0) {
      resaleListings.forEach((listing, index) => {
        console.log(`\n   ${index + 1}. Listing ID: ${listing.id}`);
        console.log(`      Ticket ID: ${listing.ticketId}`);
        console.log(`      Event ID: ${listing.eventId}`);
        console.log(`      Seller: ${listing.seller}`);
        console.log(`      Resale Price: ${listing.resalePrice} MIST`);
        console.log(`      Active: ${listing.isActive}`);
        console.log(`      Created: ${listing.createdAt}`);
      });
    } else {
      console.log("   No resale listings found in database");
    }

    // Check indexer cursor state
    const cursors = await prisma.cursor.findMany();
    console.log(`\n📊 Indexer Cursors: ${cursors.length}`);
    cursors.forEach((cursor, index) => {
      console.log(
        `   ${index + 1}. ${cursor.id}: Event Seq ${cursor.eventSeq}, TX ${cursor.txDigest.substring(0, 8)}...`
      );
    });

    console.log("\n✅ Database state check completed!");
  } catch (error) {
    console.error("❌ Error checking database state:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDatabaseState().catch(console.error);
}
