# dTickets - Decentralized Ticketing System

A decentralized ticketing platform built on the Sui blockchain that enables secure event creation, ticket purchasing, and peer-to-peer ticket resale with NFT-based ownership verification.

## 🌟 Overview

**dTickets** is a comprehensive Web3 ticketing solution that eliminates intermediaries and provides transparent, secure event ticketing. The platform consists of three main components:

- **Smart Contracts**: Sui Move contracts for event and ticket management
- **Backend API & Indexer**: Real-time blockchain event indexing and REST API
- **Frontend dApp**: Modern Next.js application with Sui wallet integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  Smart          │
│   (Next.js)     │◄──►│  (Express API    │◄──►│  Contracts      │
│                 │    │   + Indexer)     │    │  (Sui Move)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Sui Wallet     │    │   SQLite DB      │    │  Sui Blockchain │
│  Integration    │    │                  │    │   Network       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ Features

### Core Functionality

- **Event Creation**: Anyone can create and organize events
- **NFT Tickets**: Each ticket is a unique NFT with provable ownership
- **Primary Sales**: Direct ticket purchases from event organizers
- **Resale Market**: Peer-to-peer ticket resale with price flexibility
- **Real-time Updates**: Live synchronization with blockchain events

### User Features

- **My Events**: Manage events you've created
- **My Tickets**: View and manage owned tickets
- **Resale Market**: List tickets for resale or purchase from others
- **Wallet Integration**: Seamless Sui wallet connectivity

### Technical Features

- **Resumable Indexing**: Fault-tolerant blockchain event processing
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Responsive design with Tailwind CSS and Radix UI
- **Real-time Sync**: 1-second polling for immediate updates

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Sui CLI** for smart contract deployment
- **Git** for cloning the repository

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dtickets
```

### 2. Smart Contract Setup

```bash
cd contracts/dtickets

# Install Sui CLI if not already installed
# https://docs.sui.io/references/cli

# Build the contract
sui move build

# Deploy to devnet (save the package ID)
sui client publish --gas-budget 100000000
```

### 3. Backend Setup

```bash
cd api

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# NETWORK=devnet
# DTICKETS_PACKAGE_ID=<your-deployed-package-id>
# POLLING_INTERVAL_MS=1000

# Set up database
npm run db:setup:dev

# Start the backend services
npm run dev
```

This starts both the API server (port 3001) and the indexer.

### 4. Frontend Setup

```bash
cd frontend/dtickets

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## 📁 Project Structure

```
dtickets/
├── contracts/dtickets/          # Sui Move smart contracts
│   ├── sources/
│   │   └── dtickets.move       # Main contract logic
│   │   └── tests/
│   │   └── dtickets_tests.move # Contract tests
│   └── Move.toml               # Package configuration
│
├── api/                        # Backend API & Indexer
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── indexer/                # Blockchain indexer logic
│   ├── server.ts               # Express API server
│   ├── indexer.ts              # Indexer entry point
│   └── package.json
│
└── frontend/dtickets/          # Next.js Frontend
    ├── app/                    # App Router pages
    │   ├── my-events/          # Event management
    │   ├── my-tickets/         # Ticket management
    │   └── resale-market/      # Resale marketplace
    ├── components/             # React components
    │   ├── ui/                 # Reusable UI components
    │   ├── event/              # Event-related components
    │   └── ticket/             # Ticket-related components
    ├── hooks/                  # Custom React hooks
    ├── lib/                    # Utilities and configurations
    ├── mutations/              # Sui transaction builders
    └── types/                  # TypeScript type definitions
```

## 🔧 Technology Stack

### Blockchain

- **Sui Blockchain**: Layer 1 blockchain for smart contracts
- **Move Language**: Smart contract programming language
- **@mysten/sui**: TypeScript SDK for Sui interaction

### Backend

- **Node.js + Express**: REST API server
- **Prisma**: Database ORM and migrations
- **SQLite**: Database storage
- **TypeScript**: Type-safe development

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **@mysten/dapp-kit**: Sui wallet integration
- **TanStack Query**: Server state management

## 🔍 Smart Contract Details

The main smart contract (`dtickets.move`) implements:

### Core Structs

- **Event**: Represents ticketed events with metadata
- **Ticket**: NFT tickets with ownership tracking
- **ResaleListing**: Marketplace listings for ticket resale

### Key Functions

- `create_event()`: Create new events with ticket allocation
- `purchase_ticket()`: Buy tickets directly from organizers
- `list_ticket_for_resale()`: List owned tickets for resale
- `purchase_resale_ticket()`: Buy tickets from resale market
- `cancel_resale_listing()`: Remove tickets from resale market

### Events Emitted

- `EventCreated`: New event creation
- `TicketPurchased`: Direct ticket sales
- `TicketListedForResale`: Resale listing creation
- `TicketResold`: Successful resale transactions
- `TicketResaleCancelled`: Resale listing cancellation

## 🗄️ Database Schema

### Events Table

- Event metadata, pricing, and supply information
- Links to organizer and ticket relationships

### Tickets Table

- Individual ticket NFTs with ownership tracking
- Links to events and resale status

### Resale Listings Table

- Active and historical resale marketplace data
- Price tracking and transaction history

### Cursors Table

- Blockchain indexing checkpoints for resumable sync

## 🔄 API Endpoints

The backend API provides RESTful endpoints for:

- **GET** `/events` - List all events
- **GET** `/events/:id` - Get specific event details
- **GET** `/tickets` - List tickets (with ownership filters)
- **GET** `/resale-listings` - List active resale listings
- **GET** `/health` - API health check

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts/dtickets
sui move test
```

### Backend Tests

```bash
cd api
npm test
```

### Frontend Tests

```bash
cd frontend/dtickets
npm test
```

## 🚀 Deployment

### Smart Contracts

1. Deploy to Sui testnet/mainnet using Sui CLI
2. Update package ID in backend configuration

### Backend

1. Set up production database (SQLite is used by default)
2. Configure environment variables
3. Deploy to your preferred hosting service
4. Ensure indexer runs continuously

### Frontend

1. Update API endpoints for production
2. Configure Sui network settings
3. Deploy to Vercel, Netlify, or similar platform
