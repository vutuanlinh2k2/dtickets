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
import { Loader2, AlertTriangle, XCircle } from "lucide-react";
import type { ResaleListing } from "../types";
import { formatSuiAmount } from "@/lib/formatSuiAmount";

interface CancelResellModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ResaleListing;
  onCancelConfirm: (listingId: string) => Promise<"success" | "failed">;
}

export default function CancelResellModal({
  isOpen,
  onClose,
  listing,
  onCancelConfirm,
}: CancelResellModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await onCancelConfirm(listing.id);
    setIsSubmitting(false);

    if (result === "success") {
      onClose();
    }
    // Error handling is done in the parent component via toast
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md bg-ocean text-cloud border-sea">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-yellow-400" /> Cancel
            Listing
          </DialogTitle>
          <DialogDescription className="text-aqua pt-2">
            Are you sure you want to remove your ticket for &quot;
            {listing.eventName}&quot; from the resale market? It will no longer
            be available for purchase by others.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="text-center p-4 bg-deep-ocean/30 rounded-lg border border-sea/50">
            <p className="text-cloud mb-1">
              Event:{" "}
              <span className="font-semibold text-sea">
                {listing.eventName}
              </span>
            </p>
            <p className="text-aqua">
              Current Listing Price:{" "}
              <span className="font-semibold text-sea">
                {formatSuiAmount(listing.listingPrice)} SUI
              </span>
            </p>
          </div>
          <p className="text-sm text-aqua/80 text-center">
            This action cannot be undone. You can re-list the ticket later if
            needed.
          </p>
        </div>

        <DialogFooter className="pt-4 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-sea text-aqua hover:bg-sea hover:text-deep-ocean"
            disabled={isSubmitting}
          >
            Keep Listing
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            className="flex-1 bg-red-600/80 hover:bg-red-500 text-white disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Cancelling..." : "Yes, Cancel Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
