"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResaleListing } from "../types";
import { formatUnixTimestamp } from "@/lib/utils";
import Image from "next/image";

interface BuyResoldTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ResaleListing;
  currentUserAddress: string;
  onPurchaseConfirm: (
    listingId: string
  ) => Promise<"success" | "failed" | "not_available">;
}

export default function BuyResoldTicketModal({
  isOpen,
  onClose,
  listing,
  currentUserAddress,
  onPurchaseConfirm,
}: BuyResoldTicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (
      listing.sellerAddress.toLowerCase() === currentUserAddress.toLowerCase()
    ) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot buy your own listed ticket.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await onPurchaseConfirm(listing.listingId);
    setIsSubmitting(false);

    if (result === "success") {
      // Toast is handled by parent component ResaleMarketList
      handleClose();
    } else if (result === "not_available") {
      // Toast handled by parent
      handleClose(); // Close modal as listing is gone
    }
    // "failed" toast is handled by parent
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg bg-ocean text-cloud border-sea">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl">
            Confirm Purchase
          </DialogTitle>
          <DialogDescription className="text-aqua">
            You are about to buy a ticket for "{listing.eventName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {listing.imageUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-sea">
              <Image
                src={listing.imageUrl || "/placeholder.svg"}
                alt={listing.eventName}
                layout="fill"
                objectFit="cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean/50 to-transparent" />
            </div>
          )}
          <div className="bg-deep-ocean p-4 rounded-lg border border-sea/50 space-y-2">
            <p className="text-lg text-cloud font-semibold">
              {listing.eventName}
            </p>
            <p className="text-sm text-aqua">
              Date: {formatUnixTimestamp(listing.eventDate)}
            </p>
            <p className="text-sm text-aqua">Venue: {listing.venueName}</p>
            <p className="text-sm text-aqua">
              Original Price: {listing.originalPrice} SUI
            </p>
            <p className="text-sm text-aqua">
              Seller:{" "}
              <span className="font-mono text-xs">
                {listing.sellerAddress.substring(0, 10)}...
              </span>
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-aqua">You Pay (Resale Price):</p>
            <p className="text-3xl font-bold text-sea">
              {listing.resalePrice} SUI
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-sea text-aqua hover:bg-sea hover:text-deep-ocean"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:opacity-50"
            disabled={
              isSubmitting ||
              listing.sellerAddress.toLowerCase() ===
                currentUserAddress.toLowerCase()
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShoppingCart className="mr-2 h-4 w-4" /> Confirm & Buy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
