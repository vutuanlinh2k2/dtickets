import { getClient } from "./sui-utils";
import { CONFIG } from "./config";

async function debugEvents() {
  console.log("🔍 Debugging events on the blockchain...\n");

  const client = getClient(CONFIG.NETWORK);

  console.log(`📡 Network: ${CONFIG.NETWORK}`);
  console.log(`📦 Package ID: ${CONFIG.DTICKETS_CONTRACT.packageId}\n`);

  try {
    // Query all events for the dtickets module
    const { data, hasNextPage, nextCursor } = await client.queryEvents({
      query: {
        MoveEventModule: {
          module: "dtickets",
          package: CONFIG.DTICKETS_CONTRACT.packageId,
        },
      },
      order: "ascending",
      limit: 50,
    });

    console.log(`📊 Found ${data.length} events`);
    console.log(`   Has next page: ${hasNextPage}`);
    console.log(
      `   Next cursor: ${nextCursor ? JSON.stringify(nextCursor) : "null"}\n`
    );

    data.forEach((event, index) => {
      console.log(`🎯 Event ${index + 1}:`);
      console.log(`   Type: ${event.type}`);
      console.log(`   TX Digest: ${event.id.txDigest}`);
      console.log(`   Event Seq: ${event.id.eventSeq}`);
      console.log(`   Sender: ${event.sender}`);
      console.log(`   Data:`, JSON.stringify(event.parsedJson, null, 2));
      console.log("");
    });

    if (data.length === 0) {
      console.log("❌ No events found. This could mean:");
      console.log("   1. Events were created on a different package");
      console.log("   2. Events are not yet finalized on the network");
      console.log("   3. The package ID is incorrect");
    }
  } catch (error) {
    console.error("❌ Error querying events:", error);
  }
}

debugEvents().catch(console.error);
