import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getClient } from "./sui-utils";
import { CONFIG } from "./config";
import { requestSuiFromFaucet } from "./helpers/transaction-helpers";

async function checkBalances() {
  const client = getClient(CONFIG.NETWORK);

  // Create keypairs from provided private keys
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

  console.log("📋 Checking account balances...\n");

  const accounts = [
    { name: "Organizer", address: organizerAddress },
    { name: "User1", address: user1Address },
    { name: "User2", address: user2Address },
  ];

  for (const account of accounts) {
    try {
      const balance = await client.getBalance({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });

      const balanceInSui = parseInt(balance.totalBalance) / 1_000_000_000;
      console.log(`${account.name} (${account.address}):`);
      console.log(
        `   Balance: ${balanceInSui.toFixed(3)} SUI (${balance.totalBalance} MIST)`
      );
      console.log(`   Coin Objects: ${balance.coinObjectCount}\n`);

      // If balance is too low, request from faucet
      if (balanceInSui < 1) {
        console.log(
          `⛽ ${account.name} has low balance, requesting SUI from faucet...`
        );
        try {
          await requestSuiFromFaucet(account.address);
          console.log(`✅ Faucet request sent for ${account.name}\n`);
        } catch (error) {
          console.log(
            `❌ Faucet request failed for ${account.name}: ${error}\n`
          );
        }
      }
    } catch (error) {
      console.log(`❌ Error getting balance for ${account.name}: ${error}\n`);
    }
  }
}

if (require.main === module) {
  checkBalances().catch(console.error);
}
