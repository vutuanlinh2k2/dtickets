"use client";

import { useState, useEffect, useMemo } from "react";
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
  Tag,
  Loader2,
  Search,
  Filter,
  ShoppingCart,
} from "lucide-react";
import { formatUnixTimestamp } from "@/lib/utils";
import Image from "next/image";
import BuyResoldTicketModal from "./BuyResoldTicketModal";
import ProcessingOverlay from "./ProcessingOverlay";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface ResaleListing {
  listingId: string;
  ticketId: string; // Original ticket ID
  eventId: string;
  eventName: string;
  eventDate: number;
  venueName: string;
  originalPrice: number;
  resalePrice: number;
  sellerAddress: string;
  imageUrl?: string;
  listedDate: number;
}

interface ResaleMarketListProps {
  walletAddress: string;
}

// Mock function to fetch all available resale listings (excluding user's own)
const fetchMockResaleListings = async (
  currentUserAddress: string
): Promise<ResaleListing[]> => {
  console.log("Fetching resale listings for market...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const now = Math.floor(Date.now() / 1000);
  const allListings: ResaleListing[] = [
    {
      listingId: "resale1",
      ticketId: "ticket1_owned_by_sellerA",
      eventId: "1",
      eventName: "Sui Blockchain Summit",
      eventDate: now + 86400 * 7,
      venueName: "Crypto Convention Center",
      originalPrice: 25,
      resalePrice: 30, // Marked up
      sellerAddress: "0xSellerA",
      imageUrl:
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop",
      listedDate: now - 86400 * 1,
    },
    {
      listingId: "resale2",
      ticketId: "ticket2_owned_by_sellerB",
      eventId: "3",
      eventName: "Decentralized Music Fest",
      eventDate: now + 86400 * 30,
      venueName: "Open Air Amphitheater",
      originalPrice: 10,
      resalePrice: 8, // Discounted
      sellerAddress: "0xSellerB",
      imageUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop",
      listedDate: now - 86400 * 0.5,
    },
    {
      listingId: "resale3",
      ticketId: "ticket5_owned_by_sellerC",
      eventId: "6",
      eventName: "Community Meetup: Web3 Future",
      eventDate: now + 86400 * 10,
      venueName: "Local Co-working Space",
      originalPrice: 2,
      resalePrice: 5,
      sellerAddress: "0xSellerC",
      // No image
      listedDate: now - 86400 * 2,
    },
    {
      listingId: "resale_my_own_filtered_out", // This should be filtered out if walletAddress matches sellerAddress
      ticketId: "ticket_my_own",
      eventId: "2",
      eventName: "NFT Art Gala (My Listing)",
      eventDate: now + 86400 * 5,
      venueName: "Digital Art Gallery",
      originalPrice: 50,
      resalePrice: 55,
      sellerAddress: "0xUserWallet123", // Assume this is the current user for testing
      imageUrl:
        "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop",
      listedDate: now - 86400 * 0.2,
    },
  ];
  return allListings.filter(
    (listing) =>
      listing.sellerAddress.toLowerCase() !== currentUserAddress.toLowerCase()
  );
};

export default function ResaleMarketList({
  walletAddress,
}: ResaleMarketListProps) {
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ResaleListing | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("date_desc"); // e.g., price_asc, price_desc, date_desc
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    fetchMockResaleListings(walletAddress)
      .then(setListings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [walletAddress]);

  const handleBuyClick = (listing: ResaleListing) => {
    setSelectedListing(listing);
    setIsBuyModalOpen(true);
  };

  const handlePurchaseConfirm = async (
    listingId: string
  ): Promise<"success" | "failed" | "not_available"> => {
    setIsProcessing(true);
    console.log(
      `Attempting to purchase resold ticket: ${listingId} by ${walletAddress}`
    );
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const listingExists = listings.find((l) => l.listingId === listingId);
    if (!listingExists) {
      setIsProcessing(false);
      toast({
        title: "Purchase Failed",
        description: "This listing is no longer available.",
        variant: "destructive",
      });
      return "not_available";
    }

    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
      setListings((prev) => prev.filter((l) => l.listingId !== listingId)); // Remove from market
      // In a real app, this ticket would be transferred to the buyer's MyTicketsList
      toast({
        title: "Purchase Successful!",
        description: `You bought a ticket for ${selectedListing?.eventName}.`,
        variant: "default",
      });
      setIsProcessing(false);
      return "success";
    } else {
      toast({
        title: "Purchase Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return "failed";
    }
  };

  const filteredAndSortedListings = useMemo(() => {
    const temp = listings.filter(
      (listing) =>
        listing.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.venueName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortOrder) {
      case "price_asc":
        temp.sort((a, b) => a.resalePrice - b.resalePrice);
        break;
      case "price_desc":
        temp.sort((a, b) => b.resalePrice - a.resalePrice);
        break;
      case "date_asc":
        temp.sort((a, b) => a.listedDate - b.listedDate);
        break;
      case "date_desc":
      default:
        temp.sort((a, b) => b.listedDate - a.listedDate);
        break;
    }
    return temp;
  }, [listings, searchTerm, sortOrder]);

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
      <div className="flex flex-col md:flex-row gap-4 p-1">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by event name or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-ocean border-sea text-cloud focus:ring-sea w-full hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300"
          />
        </div>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full md:w-[200px] bg-ocean border-sea text-cloud focus:ring-sea hover:border-aqua hover:shadow-md hover:shadow-sea/20 transition-all duration-300">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-ocean text-cloud border-sea">
            <SelectItem
              value="date_desc"
              className="hover:bg-sea hover:text-deep-ocean"
            >
              Listed: Newest
            </SelectItem>
            <SelectItem
              value="date_asc"
              className="hover:bg-sea hover:text-deep-ocean"
            >
              Listed: Oldest
            </SelectItem>
            <SelectItem
              value="price_asc"
              className="hover:bg-sea hover:text-deep-ocean"
            >
              Price: Low to High
            </SelectItem>
            <SelectItem
              value="price_desc"
              className="hover:bg-sea hover:text-deep-ocean"
            >
              Price: High to Low
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAndSortedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-aqua bg-deep-ocean/30 p-6 rounded-lg border border-sea/50">
          <ShoppingCart className="h-16 w-16 text-sea mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Marketplace is Empty</h2>
          <p className="text-center max-w-md">
            No tickets are currently listed for resale, or none match your
            search. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedListings.map((listing) => (
            <Card
              key={listing.listingId}
              className="bg-ocean text-cloud border-sea flex flex-col h-full overflow-hidden hover:shadow-2xl hover:shadow-sea/30 hover:border-aqua hover:border-2 transition-all duration-300 cursor-pointer group hover:bg-ocean/80"
            >
              {listing.imageUrl ? (
                <div className="relative w-full h-40 overflow-hidden">
                  <Image
                    src={listing.imageUrl || "/placeholder.svg"}
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
                  Listed: {formatUnixTimestamp(listing.listedDate, false)}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                  {formatUnixTimestamp(listing.eventDate)}
                </div>
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                  {listing.venueName}
                </div>
                <div className="flex items-center text-aqua group-hover:text-cloud transition-colors duration-300">
                  <Tag className="mr-2 h-4 w-4 flex-shrink-0" />
                  Original Price: {listing.originalPrice} SUI
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch space-y-2">
                <div className="text-center mb-2">
                  <p className="text-xs text-aqua">Resale Price</p>
                  <p className="text-2xl font-bold text-sea group-hover:text-aqua transition-colors duration-300">
                    {listing.resalePrice} SUI
                  </p>
                </div>
                <Button
                  onClick={() => handleBuyClick(listing)}
                  className="w-full bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:bg-gray-500 transition-all duration-300"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Buy Ticket
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
        message="Processing your purchase..."
      />
    </div>
  );
}
