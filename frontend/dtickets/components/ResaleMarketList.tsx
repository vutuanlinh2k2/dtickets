"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TicketIcon,
  CalendarDays,
  MapPin,
  Loader2,
  ShoppingCart,
  User,
} from "lucide-react";
import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import BuyResoldTicketModal from "./BuyResoldTicketModal";
import ProcessingOverlay from "./ProcessingOverlay";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../constants";
import type { ResaleListing } from "../types";
import { formatSuiAmount } from "@/lib/formatSuiAmount";
import { usePurchaseResaleTicketMutation } from "../mutations/purchaseResaleTicket";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { API_ENDPOINT } from "../constants";

interface ResaleMarketListProps {
  walletAddress: string;
}

export default function ResaleMarketList({
  walletAddress,
}: ResaleMarketListProps) {
  const currentAccount = useCurrentAccount();
  const purchaseResaleTicketMutation = usePurchaseResaleTicketMutation();
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ResaleListing | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const isWalletConnected = !!currentAccount?.address;

  const { data, isLoading } = useQuery({
    queryKey: [QueryKey.ResaleMarket, walletAddress],
    queryFn: async () => {
      const response = await fetch(
        `${API_ENDPOINT}/resale-tickets?exclude=${walletAddress}`
      );
      return response.json();
    },
    enabled: !!walletAddress,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resaleListings: ResaleListing[] = (data ?? []).map((listing: any) => ({
    id: listing.id,
    ticketId: listing.ticketId,
    eventId: listing.event.id,
    eventName: listing.event.name,
    eventStartTime: listing.event.startTime,
    eventEndTime: listing.event.endTime,
    eventVenue: listing.event.venue,
    eventImgUrl: listing.event.imgUrl,
    listingPrice: listing.resalePrice,
    createdAt: listing.createdAt,
    seller: listing.seller,
  }));

  const handleBuyClick = (listing: ResaleListing) => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to purchase tickets.",
        variant: "destructive",
      });
      return;
    }
    setSelectedListing(listing);
    setIsBuyModalOpen(true);
  };

  const handlePurchaseConfirm = async (): Promise<
    "success" | "failed" | "not_available"
  > => {
    if (!selectedListing) return "failed";

    setIsProcessing(true);

    try {
      await purchaseResaleTicketMutation.mutateAsync(selectedListing);

      toast({
        title: "Purchase Successful!",
        description: `You bought a ticket for ${selectedListing.eventName}.`,
        variant: "default",
      });
      return "success";
    } catch (error) {
      console.error("Purchase failed:", error);

      // Handle specific error cases
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      if (
        errorMessage.includes("not available") ||
        errorMessage.includes("sold")
      ) {
        toast({
          title: "Ticket Not Available",
          description: "This ticket has already been sold to someone else.",
          variant: "destructive",
        });
        return "not_available";
      } else {
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return "failed";
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold">Loading Resale Market...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {resaleListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-aqua bg-deep-ocean/30 p-6 rounded-lg border border-sea/50">
          <ShoppingCart className="h-16 w-16 text-sea mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Marketplace is Empty</h2>
          <p className="text-center max-w-md">
            No tickets are currently listed for resale. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resaleListings.map((listing) => (
            <Card
              key={listing.id}
              className="bg-ocean text-cloud border-sea flex flex-col h-full overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua transition-all duration-300 cursor-pointer group hover:bg-ocean/80"
            >
              {listing.eventImgUrl ? (
                <div className="relative w-full h-40 overflow-hidden">
                  <Image
                    src={listing.eventImgUrl || "/placeholder.svg"}
                    alt={listing.eventName}
                    fill
                    className="object-cover transition-all duration-500 group-hover:brightness-110 group-hover:contrast-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean/60 to-transparent group-hover:from-ocean/40 transition-all duration-300" />
                </div>
              ) : (
                <div className="relative w-full h-40 bg-gradient-to-br from-sea/20 via-aqua/10 to-sea/30 overflow-hidden transition-all duration-500 group-hover:from-sea/40 group-hover:via-aqua/30 group-hover:to-sea/50">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                    <TicketIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-sea/40 group-hover:text-sea/70 transition-colors duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean/40 to-transparent" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-sea text-xl group-hover:text-aqua transition-colors duration-300">
                  {listing.eventName}
                </CardTitle>
                <div className="text-xs text-aqua/70">
                  Listed: {formatDateString(listing.createdAt)}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                  {formatDateString(listing.eventStartTime)} -{" "}
                  {formatDateString(listing.eventEndTime)}
                </div>
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                  {listing.eventVenue}
                </div>
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <User className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">
                    Seller: {listing.seller.slice(0, 6)}...
                    {listing.seller.slice(-4)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch space-y-2">
                <div className="text-center mb-2">
                  <p className="text-xs text-aqua">Resale Price</p>
                  <p className="text-2xl font-bold text-sea group-hover:text-aqua transition-colors duration-300">
                    {formatSuiAmount(listing.listingPrice)} SUI
                  </p>
                </div>
                <Button
                  onClick={() => handleBuyClick(listing)}
                  className="w-full bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:bg-gray-500 transition-all duration-300"
                  disabled={!isWalletConnected}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isWalletConnected ? "Buy Ticket" : "Connect Wallet to Buy"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedListing && (
        <BuyResoldTicketModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          listing={selectedListing}
          onPurchaseConfirm={handlePurchaseConfirm}
          currentUserAddress={walletAddress}
        />
      )}
      <ProcessingOverlay
        isVisible={isProcessing}
        message="Processing your purchase... Please confirm the transaction in your wallet."
      />
    </div>
  );
}
