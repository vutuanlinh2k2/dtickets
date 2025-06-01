"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "../types";

interface ResellTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onConfirmResell: (
    resalePrice: number
  ) => Promise<"success" | "failed" | "invalid_price">;
}

export default function ResellTicketModal({
  isOpen,
  onClose,
  ticket,
  onConfirmResell,
}: ResellTicketModalProps) {
  const [resalePrice, setResalePrice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validatePrice = (priceStr: string): number | null => {
    const price = Number.parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      setError("Resale price must be a positive number.");
      return null;
    }
    // You might add more validation, e.g. max price or comparison to original price
    setError(null);
    return price;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = validatePrice(resalePrice);
    if (priceNum === null) return;

    setIsSubmitting(true);
    const result = await onConfirmResell(priceNum);
    setIsSubmitting(false);

    if (result === "success") {
      toast({
        title: "Ticket Listed for Resale!",
        description: `${ticket.eventName} is now on the market for ${priceNum} SUI.`,
        variant: "default",
      });
      handleClose();
    } else if (result === "invalid_price") {
      setError("The provided price was invalid. Please check and try again.");
      toast({
        title: "Listing Failed",
        description: "Invalid resale price.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Listing Failed",
        description: "Could not list ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setResalePrice("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md bg-ocean text-cloud border-sea">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl">Resell Ticket</DialogTitle>
          <DialogDescription className="text-aqua">
            List your ticket for &quot;{ticket.eventName}&quot; on the resale
            market.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <p className="text-aqua text-sm">
              Event:{" "}
              <span className="text-cloud font-semibold">
                {ticket.eventName}
              </span>
            </p>
            <p className="text-aqua text-sm">
              Ticket ID:{" "}
              <span className="text-cloud font-semibold">
                {ticket.ticketNumber}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resalePrice" className="text-aqua">
              Set Resale Price (SUI)
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="resalePrice"
                type="number"
                value={resalePrice}
                onChange={(e) => {
                  setResalePrice(e.target.value);
                  if (error) validatePrice(e.target.value); // Clear error on change if valid
                }}
                placeholder="e.g., 15"
                min="0.01"
                step="any"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea pl-10"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 flex items-center">
                <AlertCircle className="mr-1 h-4 w-4" />
                {error}
              </p>
            )}
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
              type="submit"
              className="flex-1 bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:opacity-50"
              disabled={isSubmitting || !resalePrice || !!error}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              List for Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
