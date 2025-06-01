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
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import CancelResellModal from "./CancelResellModal";
import ProcessingOverlay from "./ProcessingOverlay";
import type { ResaleListing } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../constants";
import { formatDateString } from "@/lib/utils";
import { formatSuiAmount } from "@/lib/formatSuiAmount";
import { useCancelResaleMutation } from "../mutations/cancelResale";

interface MyListedTicketsProps {
  walletAddress: string;
}

export default function MyListedTickets({
  walletAddress,
}: MyListedTicketsProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedListingToCancel, setSelectedListingToCancel] =
    useState<ResaleListing | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { mutate: cancelResale } = useCancelResaleMutation();

  const { data, isLoading } = useQuery({
    queryKey: [QueryKey.MyListedTickets],
    queryFn: async () => {
      const data = await fetch(
        `http://localhost:3001/api/resale-tickets/seller/${walletAddress}`
      );
      return data.json();
    },
    enabled: !!walletAddress,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myListings: ResaleListing[] = (data ?? []).map((listing: any) => ({
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

  const handleCancelClick = (listing: ResaleListing) => {
    setSelectedListingToCancel(listing);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async (
    listingId: string
  ): Promise<"success" | "failed"> => {
    return new Promise((resolve) => {
      setIsProcessing(true);
      cancelResale(listingId, {
        onSuccess: () => {
          toast({
            title: "Listing Cancelled Successfully!",
            description: `Your ticket for ${selectedListingToCancel?.eventName} is no longer for sale.`,
            variant: "default",
          });
          setIsProcessing(false);
          resolve("success");
        },
        onError: (error) => {
          console.error("Failed to cancel listing:", error);
          toast({
            title: "Cancellation Failed",
            description: "Could not cancel listing. Please try again.",
            variant: "destructive",
          });
          setIsProcessing(false);
          resolve("failed");
        },
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-aqua">
        <Loader2 className="h-12 w-12 animate-spin text-sea mb-4" />
        <h2 className="text-xl font-semibold">
          Loading Your Listed Tickets...
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-aqua bg-deep-ocean/30 p-6 rounded-lg border border-sea/50">
          <AlertTriangle className="h-16 w-16 text-sea mb-6" />
          <h2 className="text-2xl font-semibold mb-3">No Active Listings</h2>
          <p className="text-center max-w-md">
            You haven&apos;t listed any tickets for resale yet. Go to &quot;My
            Tickets&quot; to list one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myListings.map((listing) => (
            <Card
              key={listing.id}
              className="bg-ocean text-cloud border-sea flex flex-col h-full overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua transition-all duration-300 group hover:bg-ocean/80"
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
              </CardContent>
              <CardFooter className="flex-col items-stretch space-y-2">
                <div className="text-center mb-2">
                  <p className="text-xs text-aqua">Your Listing Price</p>
                  <p className="text-2xl font-bold text-sea group-hover:text-aqua transition-colors duration-300">
                    {formatSuiAmount(listing.listingPrice)} SUI
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleCancelClick(listing)}
                  className="w-full bg-red-600/80 hover:bg-red-500 text-white transition-all duration-300"
                  disabled={isProcessing}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Listing
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedListingToCancel && (
        <CancelResellModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedListingToCancel(null);
          }}
          listing={selectedListingToCancel}
          onCancelConfirm={handleCancelConfirm}
        />
      )}
      <ProcessingOverlay
        isVisible={isProcessing}
        message="Cancelling your listing..."
      />
    </div>
  );
}
