// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { prisma } from "./db";

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...");

  try {
    // Delete in order due to foreign key constraints
    // First delete tickets (child table)
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} tickets`);

    // Then delete events (parent table)
    const deletedEvents = await prisma.event.deleteMany({});
    console.log(`✅ Deleted ${deletedEvents.count} events`);

    // Finally delete cursor data
    const deletedCursors = await prisma.cursor.deleteMany({});
    console.log(`✅ Deleted ${deletedCursors.count} cursor records`);

    console.log("🎉 Database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
