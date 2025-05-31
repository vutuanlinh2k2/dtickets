import { prisma } from "./db";

async function resetIndexerCursor() {
  console.log("🔄 Resetting indexer cursor...");

  try {
    // Delete all cursor records to start indexing from the beginning
    const result = await prisma.cursor.deleteMany({});
    console.log(`✅ Deleted ${result.count} cursor records`);
    console.log("📍 Indexer will now start from the beginning");
  } catch (error) {
    console.error("❌ Error resetting cursor:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetIndexerCursor().catch(console.error);
