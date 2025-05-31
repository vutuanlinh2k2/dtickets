import { prisma } from "./db";

async function checkIndexerStatus() {
  console.log("🔍 Checking indexer status...\n");

  try {
    const events = await prisma.event.findMany();
    const tickets = await prisma.ticket.findMany();
    const cursors = await prisma.cursor.findMany();

    console.log(`📊 Database Status:`);
    console.log(`   Events: ${events.length}`);
    events.forEach((e, index) => {
      console.log(`   ${index + 1}. ${e.name} by ${e.organizer}`);
      console.log(`      ID: ${e.id}`);
      console.log(`      Tickets sold: ${e.ticketsSold}/${e.totalTickets}`);
    });

    console.log(`\n🎫 Tickets: ${tickets.length}`);
    tickets.forEach((t, index) => {
      console.log(
        `   ${index + 1}. Ticket ${t.ticketNumber} - Owner: ${t.owner}`
      );
      console.log(`      ID: ${t.id}`);
      console.log(`      Event ID: ${t.eventId}`);
    });

    console.log(`\n📍 Indexer Cursors: ${cursors.length}`);
    cursors.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.id}`);
      console.log(`      Event Seq: ${c.eventSeq}`);
      console.log(`      TX Digest: ${c.txDigest}`);
    });
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIndexerStatus().catch(console.error);
