# dTickets API & Indexer

A decentralized ticketing system built on Sui blockchain with real-time event indexing.

## Setup

1. **Install dependencies:**

   ```bash
   cd api
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `api` directory with:

   ```env
   # Network configuration (devnet, testnet, mainnet)
   NETWORK=devnet

   # Your dTickets contract package ID
   DTICKETS_PACKAGE_ID=0x...

   # Indexer polling interval in milliseconds
   POLLING_INTERVAL_MS=1000
   ```

3. **Set up the database:**

   ```bash
   npm run db:setup:dev
   ```

4. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start both the API server and the indexer concurrently.

## Architecture

### Indexer

The indexer listens to smart contract events from the Sui blockchain and stores them in the database:

- **EventCreated**: When a new event is created on the blockchain
- **TicketPurchased**: When someone purchases a ticket for an event

### Database Schema

- **Events**: Store event details (name, venue, organizer, etc.)
- **Tickets**: Store individual ticket NFTs with ownership
- **Cursors**: Track indexing progress for resumable syncing

### Key Features

- **Resumable**: The indexer tracks its progress and can resume from where it left off
- **Real-time**: Polls the blockchain every second for new events
- **Fault-tolerant**: Handles errors gracefully and continues processing
- **Batch processing**: Efficiently processes multiple events in batches
