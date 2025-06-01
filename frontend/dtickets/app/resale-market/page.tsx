"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResaleMarketList from "@/components/ResaleMarketList";
import MyListedTickets from "@/components/MyListedTickets";
import { AlertTriangle, ShoppingCart, Tag } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function ResaleMarketPage() {
  const currentAccount = useCurrentAccount();

  const isWalletConnected = !!currentAccount?.address;
  const walletAddress = currentAccount?.address || null;

  if (!isWalletConnected || !walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-16 w-16 text-sea mb-6" />
        <h2 className="text-2xl font-semibold mb-3">Wallet Not Connected</h2>
        <p className="text-center max-w-md">
          Please connect your wallet to access the ticket resale market, list
          your tickets, or purchase from others.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-sea mb-2">
          Ticket Resale Market
        </h1>
        <p className="text-lg text-aqua">
          Buy and sell event tickets from other users.
        </p>
      </header>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-deep-ocean border border-sea mb-6">
          <TabsTrigger
            value="marketplace"
            className="data-[state=active]:bg-sea data-[state=active]:text-deep-ocean data-[state=active]:shadow-lg text-aqua hover:text-sea"
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Marketplace
          </TabsTrigger>
          <TabsTrigger
            value="my-listings"
            className="data-[state=active]:bg-sea data-[state=active]:text-deep-ocean data-[state=active]:shadow-lg text-aqua hover:text-sea"
          >
            <Tag className="mr-2 h-5 w-5" /> My Listings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace">
          <ResaleMarketList walletAddress={walletAddress} />
        </TabsContent>
        <TabsContent value="my-listings">
          <MyListedTickets walletAddress={walletAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
