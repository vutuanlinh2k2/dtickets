"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react"

interface FormData {
  eventName: string
  description: string
  venueName: string
  eventDateTime: string // ISO string format from datetime-local
  ticketPrice: string // String for input, convert to number
  totalTicketSupply: string // String for input, convert to number
}

interface FormErrors {
  eventName?: string
  description?: string
  venueName?: string
  eventDateTime?: string
  ticketPrice?: string
  totalTicketSupply?: string
  general?: string
}

interface CreateEventFormProps {
  isWalletConnected: boolean
  onCreateEvent?: (
    eventData: Omit<FormData, "eventDateTime"> & {
      eventTimestamp: number
      ticketPriceNum: number
      totalTicketSupplyNum: number
    }
  ) => Promise<boolean>
}

export default function CreateEventForm({
  isWalletConnected,
  onCreateEvent,
}: CreateEventFormProps) {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    description: "",
    venueName: "",
    eventDateTime: "",
    ticketPrice: "",
    totalTicketSupply: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle")

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.eventName.trim())
      newErrors.eventName = "Event name is required."
    if (!formData.description.trim())
      newErrors.description = "Description is required."
    if (!formData.venueName.trim())
      newErrors.venueName = "Venue name is required."

    if (!formData.eventDateTime) {
      newErrors.eventDateTime = "Event date and time are required."
    } else {
      const eventDate = new Date(formData.eventDateTime)
      if (eventDate.getTime() <= Date.now()) {
        newErrors.eventDateTime = "Event date must be in the future."
      }
    }

    const price = Number.parseFloat(formData.ticketPrice)
    if (isNaN(price) || price < 0)
      newErrors.ticketPrice = "Ticket price must be a non-negative number."

    const supply = Number.parseInt(formData.totalTicketSupply, 10)
    if (isNaN(supply) || supply <= 0)
      newErrors.totalTicketSupply =
        "Total ticket supply must be a positive number."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitStatus("idle")
    if (!isWalletConnected) {
      setErrors({ general: "Please connect your wallet to create an event." })
      return
    }
    if (!validate()) return

    setIsSubmitting(true)

    const eventTimestamp = Math.floor(
      new Date(formData.eventDateTime).getTime() / 1000
    )
    const ticketPriceNum = Number.parseFloat(formData.ticketPrice)
    const totalTicketSupplyNum = Number.parseInt(formData.totalTicketSupply, 10)

    const eventDataToSubmit = {
      eventName: formData.eventName,
      description: formData.description,
      venueName: formData.venueName,
      eventTimestamp,
      ticketPriceNum,
      totalTicketSupplyNum,
    }

    console.log("Creating event:", eventDataToSubmit)
    // Simulate API call
    let success = false
    if (onCreateEvent) {
      success = await onCreateEvent(eventDataToSubmit)
    } else {
      // Default simulation if no prop provided
      await new Promise(resolve => setTimeout(resolve, 2000))
      success = Math.random() > 0.2 // 80% success
    }

    setIsSubmitting(false)
    if (success) {
      setSubmitStatus("success")
      setFormData({
        eventName: "",
        description: "",
        venueName: "",
        eventDateTime: "",
        ticketPrice: "",
        totalTicketSupply: "",
      })
      setErrors({})
    } else {
      setSubmitStatus("error")
      setErrors({ general: "Failed to create event. Please try again." })
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({ ...errors, [e.target.name]: undefined })
    }
    if (errors.general) {
      setErrors({ ...errors, general: undefined })
    }
  }

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-aqua bg-ocean p-6 rounded-lg border border-sea">
        <AlertTriangle className="h-12 w-12 text-sea mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p>Please connect your wallet to create an event.</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-ocean text-cloud border-sea">
      <CardHeader>
        <CardTitle className="text-sea text-2xl">Create New Event</CardTitle>
        <CardDescription className="text-aqua">
          Fill in the details to list your event on the platform.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <p className="text-sm text-red-400 flex items-center">
              <AlertCircle className="mr-1 h-4 w-4" />
              {errors.general}
            </p>
          )}
          {submitStatus === "success" && (
            <p className="text-sm text-green-400 flex items-center">
              <CheckCircle className="mr-1 h-4 w-4" />
              Event created successfully!
            </p>
          )}

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
              {errors.eventName && (
                <p className="text-sm text-red-400">{errors.eventName}</p>
              )}
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
              {errors.venueName && (
                <p className="text-sm text-red-400">{errors.venueName}</p>
              )}
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
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description}</p>
            )}
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
              {errors.eventDateTime && (
                <p className="text-sm text-red-400">{errors.eventDateTime}</p>
              )}
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
                placeholder="e.g., 10 or 0 for free"
                min="0"
                step="any"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.ticketPrice && (
                <p className="text-sm text-red-400">{errors.ticketPrice}</p>
              )}
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
            {errors.totalTicketSupply && (
              <p className="text-sm text-red-400">{errors.totalTicketSupply}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-sea text-deep-ocean hover:bg-opacity-80 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create Event
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// Default props for Next.js
CreateEventForm.defaultProps = {
  isWalletConnected: false,
  onCreateEvent: async data => {
    console.log("Default onCreateEvent:", data)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true // Simulate success
  },
}
