import { purchaseTicket } from "./helpers/transaction-helpers";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

async function quickTicketTest() {
  const privateKeyBytes = decodeSuiPrivateKey(
    "suiprivkey1qqg3njq0q35jr3my2sw0340rgvufp74c3rg84yl4lysfh9wnncdg6xqequp"
  ).secretKey;
  const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

  try {
    const result = await purchaseTicket({
      eventObjectId:
        "0x558179966be709cc26d25a8ff7c95a9ba0b56b2b5d51e14bc0003498277be447",
      ticketPrice: 100000000,
      keypair,
    });
    console.log("✅ Ticket purchased!", result.digest);
  } catch (error) {
    console.error("❌ Ticket purchase failed:", error);
  }
}

quickTicketTest();
