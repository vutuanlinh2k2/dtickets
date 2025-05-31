"use client";

import Link from "next/link";
import { Users, Calendar, Ticket } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function HeaderClient() {
  const account = useCurrentAccount();
  console.log('account :', account);

  return (
    <header className="bg-ocean border-b border-sea p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-sea hover:text-aqua transition-all duration-300 hover:drop-shadow-lg"
        >
          SuiTickets
        </Link>
        <nav className="space-x-6 flex items-center">
          <Link
            href="/"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Calendar className="mr-1 h-4 w-4" />
            All Events
          </Link>
          <Link
            href="/my-tickets"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Ticket className="mr-1 h-4 w-4" />
            My Tickets
          </Link>
          <Link
            href="/my-events"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Users className="mr-1 h-4 w-4" />
            My Events
          </Link>

          {/* Wallet Connection */}
          {/* TODO: update styling */}
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
