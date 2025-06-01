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
import type { ResaleListing } from "../types";
import { formatDateString } from "@/lib/utils";
import { formatSuiAmount } from "@/lib/formatSuiAmount";
import Image from "next/image";

interface BuyResoldTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ResaleListing;
  currentUserAddress: string;
  onPurchaseConfirm: () => Promise<"success" | "failed" | "not_available">;
}

export default function BuyResoldTicketModal({
  isOpen,
  onClose,
  listing,
  onPurchaseConfirm,
}: BuyResoldTicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await onPurchaseConfirm();
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
            You are about to buy a ticket for &quot;{listing.eventName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {listing.eventImgUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-sea">
              <Image
                src={listing.eventImgUrl || "/placeholder.svg"}
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
              Date: {formatDateString(listing.eventStartTime)} -{" "}
              {formatDateString(listing.eventEndTime)}
            </p>
            <p className="text-sm text-aqua">Venue: {listing.eventVenue}</p>
            <p className="text-sm text-aqua break-all">
              Seller: {listing.seller}
            </p>
            <p className="text-sm text-aqua">
              Listed: {formatDateString(listing.createdAt)}
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-aqua">You Pay (Resale Price):</p>
            <p className="text-3xl font-bold text-sea">
              {formatSuiAmount(listing.listingPrice)} SUI
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
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShoppingCart className="mr-2 h-4 w-4" /> Confirm & Buy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
