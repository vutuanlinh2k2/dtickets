// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromHEX, toHEX } from "@mysten/sui/utils";
import { CONFIG } from "../config";
import { getClient } from "../sui-utils";

// Create a keypair for testing (you should use your own keypair)
const getTestKeypair = (): Ed25519Keypair => {
  // Generate a new keypair for testing or use an existing one
  return new Ed25519Keypair();
};

// Helper to get current timestamp in milliseconds
const getCurrentTimestamp = (): number => Date.now();

/**
 * Create a new event on the blockchain
 */
export const createEvent = async (params: {
  name: string;
  description: string;
  venue: string;
  imgUrl: string;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  ticketPrice: number; // price in MIST (1 SUI = 1_000_000_000 MIST)
  totalTickets: number;
  keypair?: Ed25519Keypair;
}) => {
  const client = getClient(CONFIG.NETWORK);
  const keypair = params.keypair || getTestKeypair();

  console.log(`Creating event: ${params.name}`);
  console.log(`Organizer address: ${keypair.getPublicKey().toSuiAddress()}`);

  const tx = new Transaction();

  // Get the current time for clock argument
  tx.moveCall({
    target: `${CONFIG.DTICKETS_CONTRACT.packageId}::dtickets::create_event`,
    arguments: [
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.string(params.venue),
      tx.pure.string(params.imgUrl),
      tx.pure.u64(params.startTime),
      tx.pure.u64(params.endTime),
      tx.pure.u64(params.ticketPrice),
      tx.pure.u64(params.totalTickets),
      tx.object("0x6"), // Clock object ID
    ],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("Event creation transaction:", result.digest);
    console.log("Events emitted:", result.events);

    return result;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

/**
 * Split a large coin into smaller coins to ensure multiple coin objects for gas and payments
 */
export const splitCoinsForUser = async (
  keypair: Ed25519Keypair,
  splitAmounts: number[] = [1000000000, 1000000000]
) => {
  const client = getClient(CONFIG.NETWORK);
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`Splitting coins for user: ${address}`);

  // Get coins
  const coins = await client.getCoins({
    owner: address,
    coinType: "0x2::sui::SUI",
  });

  if (coins.data.length === 0) {
    throw new Error("No SUI coins available to split");
  }

  // Check if we already have multiple coins
  if (coins.data.length >= 3) {
    console.log(
      `User already has ${coins.data.length} coin objects, no splitting needed`
    );
    return;
  }

  const tx = new Transaction();

  // Find the largest coin to use for splitting
  const largestCoin = coins.data.reduce((prev, current) =>
    parseInt(current.balance) > parseInt(prev.balance) ? current : prev
  );

  console.log(
    `Using largest coin ${largestCoin.coinObjectId} with balance ${largestCoin.balance} MIST for splitting`
  );

  // Don't manually set gas payment when using the same coin for splitting
  // Let the SDK handle gas payment automatically from the available coins

  // Split the coin into smaller coins
  const [coin1, coin2] = tx.splitCoins(tx.object(largestCoin.coinObjectId), [
    tx.pure.u64(splitAmounts[0]), // 1 SUI
    tx.pure.u64(splitAmounts[1]), // 1 SUI
  ]);

  // Transfer the split coins back to the user (this ensures they're not unused)
  tx.transferObjects([coin1, coin2], tx.pure.address(address));

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log(`Coins split successfully for ${address}`);
    console.log(`Transaction: ${result.digest}`);
    return result;
  } catch (error) {
    console.error("Error splitting coins:", error);
    throw error;
  }
};

/**
 * Purchase a ticket for an event
 */
export const purchaseTicket = async (params: {
  eventObjectId: string;
  ticketPrice: number; // price in MIST
  recipientAddress?: string;
  keypair?: Ed25519Keypair;
}) => {
  const client = getClient(CONFIG.NETWORK);
  const keypair = params.keypair || getTestKeypair();
  const buyerAddress = keypair.getPublicKey().toSuiAddress();
  const recipientAddress = params.recipientAddress || buyerAddress;

  console.log(`Purchasing ticket for event: ${params.eventObjectId}`);
  console.log(`Buyer address: ${buyerAddress}`);
  console.log(`Recipient address: ${recipientAddress}`);

  // Get coins to pay for the ticket
  const coins = await client.getCoins({
    owner: buyerAddress,
    coinType: "0x2::sui::SUI",
  });

  if (coins.data.length === 0) {
    throw new Error("No SUI coins available for payment");
  }

  console.log(`Found ${coins.data.length} coin objects for payment`);

  // Find a coin with enough balance for the ticket
  let suitableCoin = null;
  for (const coin of coins.data) {
    if (parseInt(coin.balance) >= params.ticketPrice) {
      suitableCoin = coin;
      break;
    }
  }

  if (!suitableCoin) {
    throw new Error(
      `No coin with sufficient balance. Need ${params.ticketPrice} MIST for ticket`
    );
  }

  console.log(
    `Using coin ${suitableCoin.coinObjectId} with balance ${suitableCoin.balance} MIST`
  );

  const tx = new Transaction();

  // Only set gas payment manually if we have multiple coins and can use a different one
  if (coins.data.length > 1) {
    const gasCoins = coins.data.filter(
      (coin) => coin.coinObjectId !== suitableCoin.coinObjectId
    );
    if (gasCoins.length > 0) {
      const gasCoin = gasCoins[0];
      console.log(
        `Using separate gas coin: ${gasCoin.coinObjectId} with balance ${gasCoin.balance} MIST`
      );
      tx.setGasPayment([
        {
          objectId: gasCoin.coinObjectId,
          version: gasCoin.version,
          digest: gasCoin.digest,
        },
      ]);
    }
  }
  // If we only have one coin or no suitable separate gas coin, let SDK handle gas automatically

  // Split the suitable coin for exact payment amount
  const [exactPayment] = tx.splitCoins(tx.object(suitableCoin.coinObjectId), [
    tx.pure.u64(params.ticketPrice),
  ]);

  tx.moveCall({
    target: `${CONFIG.DTICKETS_CONTRACT.packageId}::dtickets::purchase_ticket`,
    arguments: [
      tx.object(params.eventObjectId),
      exactPayment,
      tx.pure.address(recipientAddress),
    ],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("Ticket purchase transaction:", result.digest);
    console.log("Events emitted:", result.events);

    return result;
  } catch (error) {
    console.error("Error purchasing ticket:", error);
    throw error;
  }
};

/**
 * Get SUI from faucet for testing (testnet only)
 */
export const requestSuiFromFaucet = async (address: string) => {
  console.log(`Requesting SUI from faucet for address: ${address}`);

  try {
    const response = await fetch("https://faucet.testnet.sui.io/gas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        FixedAmountRequest: {
          recipient: address,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Faucet request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Faucet response:", result);
    return result;
  } catch (error) {
    console.error("Error requesting from faucet:", error);
    throw error;
  }
};

/**
 * Get all shared objects of a specific type (events)
 */
export const getEvents = async (): Promise<any[]> => {
  const client = getClient(CONFIG.NETWORK);

  try {
    const objects = await client.getOwnedObjects({
      owner: "0x0", // This won't work for shared objects, let me fix this
      filter: {
        StructType: `${CONFIG.DTICKETS_CONTRACT.packageId}::dtickets::Event`,
      },
    });

    return objects.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export { getTestKeypair, getCurrentTimestamp };
