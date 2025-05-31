"use client"

import type React from "react"
import { useState, type FormEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2, X, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface FormData {
  eventName: string
  description: string
  venueName: string
  eventDateTime: string // ISO string format from datetime-local
  ticketPrice: string // String for input, convert to number
  totalTicketSupply: string // String for input, convert to number
  imageFile: File | null // Optional image file
}

interface FormErrors {
  eventName?: string
  description?: string
  venueName?: string
  eventDateTime?: string
  ticketPrice?: string
  totalTicketSupply?: string
  imageFile?: string
  general?: string
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateEvent?: (
    eventData: Omit<FormData, "eventDateTime"> & {
      eventTimestamp: number
      ticketPriceNum: number
      totalTicketSupplyNum: number
    },
  ) => Promise<boolean>
}

export default function CreateEventModal({ isOpen, onClose, onCreateEvent }: CreateEventModalProps) {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    description: "",
    venueName: "",
    eventDateTime: "",
    ticketPrice: "",
    totalTicketSupply: "",
    imageFile: null,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.eventName.trim()) newErrors.eventName = "Event name is required."
    if (!formData.description.trim()) newErrors.description = "Description is required."
    if (!formData.venueName.trim()) newErrors.venueName = "Venue name is required."

    if (!formData.eventDateTime) {
      newErrors.eventDateTime = "Event date and time are required."
    } else {
      const eventDate = new Date(formData.eventDateTime)
      if (eventDate.getTime() <= Date.now()) {
        newErrors.eventDateTime = "Event date must be in the future."
      }
    }

    const price = Number.parseFloat(formData.ticketPrice)
    if (isNaN(price) || price <= 0) newErrors.ticketPrice = "Ticket price must be greater than 0 SUI."

    const supply = Number.parseInt(formData.totalTicketSupply, 10)
    if (isNaN(supply) || supply <= 0) newErrors.totalTicketSupply = "Total ticket supply must be a positive number."

    // Image validation (optional)
    if (formData.imageFile) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (formData.imageFile.size > maxSize) {
        newErrors.imageFile = "Image file must be smaller than 5MB."
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!allowedTypes.includes(formData.imageFile.type)) {
        newErrors.imageFile = "Image must be JPEG, PNG, WebP, or GIF format."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, imageFile: file })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Clear any previous image errors
      if (errors.imageFile) {
        setErrors({ ...errors, imageFile: undefined })
      }
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, imageFile: null })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitStatus("idle")
    if (!validate()) return

    setIsSubmitting(true)

    const eventTimestamp = Math.floor(new Date(formData.eventDateTime).getTime() / 1000)
    const ticketPriceNum = Number.parseFloat(formData.ticketPrice)
    const totalTicketSupplyNum = Number.parseInt(formData.totalTicketSupply, 10)

    const eventDataToSubmit = {
      eventName: formData.eventName,
      description: formData.description,
      venueName: formData.venueName,
      eventTimestamp,
      ticketPriceNum,
      totalTicketSupplyNum,
      imageFile: formData.imageFile,
    }

    console.log("Creating event:", eventDataToSubmit)

    let success = false
    if (onCreateEvent) {
      success = await onCreateEvent(eventDataToSubmit)
    } else {
      // Default simulation if no prop provided
      await new Promise((resolve) => setTimeout(resolve, 2000))
      success = Math.random() > 0.2 // 80% success
    }

    setIsSubmitting(false)
    if (success) {
      setSubmitStatus("success")
      // Show success toast
      toast({
        title: "Event Created Successfully!",
        description: `"${formData.eventName}" has been created and is now live.`,
        variant: "default",
      })
      // Reset form and close modal immediately
      setFormData({
        eventName: "",
        description: "",
        venueName: "",
        eventDateTime: "",
        ticketPrice: "",
        totalTicketSupply: "",
        imageFile: null,
      })
      setImagePreview(null)
      setErrors({})
      setSubmitStatus("idle")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onClose()
    } else {
      setSubmitStatus("error")
      setErrors({ general: "Failed to create event. Please try again." })
      // Show error toast
      toast({
        title: "Event Creation Failed",
        description: "There was an error creating your event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({ ...errors, [e.target.name]: undefined })
    }
    if (errors.general) {
      setErrors({ ...errors, general: undefined })
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      // Reset form when closing
      setFormData({
        eventName: "",
        description: "",
        venueName: "",
        eventDateTime: "",
        ticketPrice: "",
        totalTicketSupply: "",
        imageFile: null,
      })
      setImagePreview(null)
      setErrors({})
      setSubmitStatus("idle")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl bg-ocean text-cloud border-sea max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl">Create New Event</DialogTitle>
          <DialogDescription className="text-aqua">
            Fill in the details to list your event on the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <p className="text-sm text-red-400 flex items-center">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.general}
            </p>
          )}

          {/* Event Image Upload */}
          <div className="space-y-2">
            <Label className="text-aqua">Event Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-sea">
                <Image
                  src={imagePreview || "/placeholder.svg?height=200&width=400&query=event+preview"}
                  alt="Event preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="w-full h-48 border-2 border-dashed border-sea rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-aqua transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 text-aqua mb-2" />
                <p className="text-aqua text-sm mb-1">Click to upload an image</p>
                <p className="text-aqua text-xs opacity-60">JPEG, PNG, WebP, or GIF (max 5MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
            {errors.imageFile && <p className="text-sm text-red-400">{errors.imageFile}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventName" className="text-aqua">
                Event Name
              </Label>
              <Input
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="e.g., Sui Summer Hackathon"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.eventName && <p className="text-sm text-red-400">{errors.eventName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueName" className="text-aqua">
                Venue Name
              </Label>
              <Input
                id="venueName"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                placeholder="e.g., Online or Physical Location"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.venueName && <p className="text-sm text-red-400">{errors.venueName}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-aqua">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us more about your event..."
              className="bg-deep-ocean border-sea text-cloud focus:ring-sea min-h-[100px]"
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventDateTime" className="text-aqua">
                Event Date & Time
              </Label>
              <Input
                id="eventDateTime"
                name="eventDateTime"
                type="datetime-local"
                value={formData.eventDateTime}
                onChange={handleChange}
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.eventDateTime && <p className="text-sm text-red-400">{errors.eventDateTime}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticketPrice" className="text-aqua">
                Ticket Price (SUI)
              </Label>
              <Input
                id="ticketPrice"
                name="ticketPrice"
                type="number"
                value={formData.ticketPrice}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0.01"
                step="0.01"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.ticketPrice && <p className="text-sm text-red-400">{errors.ticketPrice}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="totalTicketSupply" className="text-aqua">
              Total Ticket Supply
            </Label>
            <Input
              id="totalTicketSupply"
              name="totalTicketSupply"
              type="number"
              value={formData.totalTicketSupply}
              onChange={handleChange}
              placeholder="e.g., 100"
              min="1"
              step="1"
              className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
            />
            {errors.totalTicketSupply && <p className="text-sm text-red-400">{errors.totalTicketSupply}</p>}
          </div>

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
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
