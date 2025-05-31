"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Loader2, Plus, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface TicketRecipient {
  id: string
  address: string
  isValid: boolean
  errorMessage?: string
}

interface BuyTicketModalProps {
  isOpen: boolean
  onClose: () => void
  eventName: string
  ticketPrice: number
  remainingTickets: number
  userWalletAddress: string
  onPurchase: (recipients: string[]) => Promise<"success" | "failed" | "no_tickets">
}

// Sui address validation (simplified - in real app would be more comprehensive)
const validateSuiAddress = (address: string): { isValid: boolean; errorMessage?: string } => {
  if (!address.trim()) {
    return { isValid: false, errorMessage: "Address is required" }
  }

  // Basic Sui address format validation
  if (!address.startsWith("0x")) {
    return { isValid: false, errorMessage: "Address must start with 0x" }
  }

  if (address.length < 10) {
    return { isValid: false, errorMessage: "Address is too short" }
  }

  // Check for valid hex characters
  const hexPattern = /^0x[a-fA-F0-9]+$/
  if (!hexPattern.test(address)) {
    return { isValid: false, errorMessage: "Address contains invalid characters" }
  }

  return { isValid: true }
}

export default function BuyTicketModal({
  isOpen,
  onClose,
  eventName,
  ticketPrice,
  remainingTickets,
  userWalletAddress,
  onPurchase,
}: BuyTicketModalProps) {
  const [recipients, setRecipients] = useState<TicketRecipient[]>([
    {
      id: "1",
      address: userWalletAddress,
      isValid: true,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "failed" | "no_tickets">("idle")
  const { toast } = useToast()

  const addRecipient = () => {
    if (recipients.length < remainingTickets) {
      const newRecipient: TicketRecipient = {
        id: Date.now().toString(),
        address: "",
        isValid: false,
        errorMessage: "Address is required",
      }
      setRecipients([...recipients, newRecipient])
    }
  }

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((r) => r.id !== id))
    }
  }

  const updateRecipientAddress = (id: string, address: string) => {
    const validation = validateSuiAddress(address)
    setRecipients(
      recipients.map((r) =>
        r.id === id
          ? {
              ...r,
              address,
              isValid: validation.isValid,
              errorMessage: validation.errorMessage,
            }
          : r,
      ),
    )
  }

  const handleUseMyAddress = (id: string) => {
    updateRecipientAddress(id, userWalletAddress)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitStatus("idle")

    // Validate all addresses
    const allValid = recipients.every((r) => r.isValid && r.address.trim())
    if (!allValid) {
      return
    }

    // Check for duplicate addresses
    const addresses = recipients.map((r) => r.address.toLowerCase())
    const uniqueAddresses = new Set(addresses)
    if (addresses.length !== uniqueAddresses.size) {
      toast({
        title: "Duplicate Addresses",
        description: "Each ticket must have a unique recipient address.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const validAddresses = recipients.map((r) => r.address)
      const result = await onPurchase(validAddresses)
      setSubmitStatus(result)

      if (result === "success") {
        toast({
          title: "Tickets Purchased Successfully!",
          description: `${recipients.length} ticket${recipients.length > 1 ? "s" : ""} for "${eventName}" purchased successfully.`,
          variant: "default",
        })
        // Close modal immediately after success
        handleClose()
      } else if (result === "failed") {
        toast({
          title: "Purchase Failed",
          description: "There was an error processing your ticket purchase. Please try again.",
          variant: "destructive",
        })
      } else if (result === "no_tickets") {
        toast({
          title: "Not Enough Tickets",
          description: "There are not enough tickets available for your purchase.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setSubmitStatus("failed")
      toast({
        title: "Purchase Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      // Reset form
      setRecipients([
        {
          id: "1",
          address: userWalletAddress,
          isValid: true,
        },
      ])
      setSubmitStatus("idle")
    }
  }

  const totalCost = recipients.length * ticketPrice
  const canAddMore = recipients.length < remainingTickets
  const allValid = recipients.every((r) => r.isValid && r.address.trim())

  // Check if user's address is already used in any recipient
  const isUserAddressUsed = recipients.some((r) => r.address.toLowerCase() === userWalletAddress.toLowerCase())

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl bg-ocean text-cloud border-sea max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl">Buy Tickets</DialogTitle>
          <DialogDescription className="text-aqua">
            Purchase tickets for "{eventName}". You can buy tickets for yourself or others.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Summary */}
          <div className="bg-deep-ocean p-4 rounded-lg border border-sea">
            <div className="flex justify-between items-center mb-2">
              <span className="text-aqua">Tickets:</span>
              <span className="text-cloud font-semibold">{recipients.length}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-aqua">Price per ticket:</span>
              <span className="text-cloud font-semibold">{ticketPrice} SUI</span>
            </div>
            <div className="flex justify-between items-center border-t border-sea pt-2">
              <span className="text-aqua font-semibold">Total:</span>
              <span className="text-sea font-bold text-lg">{totalCost} SUI</span>
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === "failed" && (
            <div className="text-sm text-red-400 flex items-center bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="mr-2 h-4 w-4" />
              Purchase failed. Please try again.
            </div>
          )}
          {submitStatus === "no_tickets" && (
            <div className="text-sm text-red-400 flex items-center bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="mr-2 h-4 w-4" />
              Not enough tickets available.
            </div>
          )}

          {/* Recipients List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-aqua font-semibold">Ticket Recipients</Label>
              {canAddMore && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRecipient}
                  className="border-sea text-aqua hover:bg-sea hover:text-deep-ocean"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Recipient
                </Button>
              )}
            </div>

            {recipients.map((recipient, index) => {
              const isCurrentUserAddress = recipient.address.toLowerCase() === userWalletAddress.toLowerCase()
              const canUseMyAddress = !isUserAddressUsed || isCurrentUserAddress

              return (
                <div key={recipient.id} className="bg-deep-ocean p-4 rounded-lg border border-sea space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="border-sea text-aqua">
                      Ticket #{index + 1}
                    </Badge>
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRecipient(recipient.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={recipient.address}
                        onChange={(e) => updateRecipientAddress(recipient.id, e.target.value)}
                        placeholder="0x..."
                        className={`flex-1 bg-ocean border-sea text-cloud focus:ring-sea ${
                          !recipient.isValid && recipient.address ? "border-red-500" : ""
                        }`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleUseMyAddress(recipient.id)}
                        className="border-sea text-aqua hover:bg-sea hover:text-deep-ocean whitespace-nowrap"
                        disabled={!canUseMyAddress}
                      >
                        <User className="mr-1 h-4 w-4" />
                        Use My Address
                      </Button>
                    </div>
                    {!recipient.isValid && recipient.errorMessage && (
                      <p className="text-sm text-red-400">{recipient.errorMessage}</p>
                    )}
                    {!canUseMyAddress && !isCurrentUserAddress && (
                      <p className="text-sm text-yellow-400">Your address is already used for another ticket</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              className="flex-1 bg-sea text-deep-ocean hover:bg-opacity-80 disabled:opacity-50"
              disabled={isSubmitting || !allValid || recipients.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${recipients.length} Ticket${recipients.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
