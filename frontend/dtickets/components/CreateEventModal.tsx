"use client";

import type React from "react";
import { useState, type FormEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, X, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { EventCreationData } from "@/types";
import { SUI_DECIMALS } from "@mysten/sui/utils";

interface FormErrors {
  name?: string;
  description?: string;
  venue?: string;
  startTime?: string;
  endTime?: string;
  ticketPrice?: string;
  totalTickets?: string;
  imageUrl?: string;
  general?: string;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent?: (eventData: EventCreationData) => Promise<boolean>;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onCreateEvent,
}: CreateEventModalProps) {
  const [eventCreationData, setEventCreationData] = useState<EventCreationData>(
    {
      name: "",
      description: "",
      venue: "",
      startTime: 0,
      endTime: 0,
      ticketPrice: 0,
      totalTickets: 0,
      imageUrl: "",
    }
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [ticketPriceString, setTicketPriceString] = useState("");
  const [totalTicketsString, setTotalTicketsString] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!eventCreationData.name.trim())
      newErrors.name = "Event name is required.";
    if (!eventCreationData.description.trim())
      newErrors.description = "Description is required.";
    if (!eventCreationData.venue.trim())
      newErrors.venue = "Venue name is required.";

    if (!startDateTime) {
      newErrors.startTime = "Event start date and time are required.";
    } else {
      const eventDate = new Date(startDateTime);
      if (eventDate.getTime() <= Date.now()) {
        newErrors.startTime = "Event start date must be in the future.";
      }
    }

    if (!endDateTime) {
      newErrors.endTime = "Event end date and time are required.";
    } else if (startDateTime) {
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      if (endDate.getTime() <= startDate.getTime()) {
        newErrors.endTime = "Event end time must be after start time.";
      }
    }

    const price = Number.parseFloat(ticketPriceString);
    if (isNaN(price) || price <= 0)
      newErrors.ticketPrice = "Ticket price must be greater than 0 SUI.";

    const supply = Number.parseInt(totalTicketsString, 10);
    if (isNaN(supply) || supply <= 0)
      newErrors.totalTickets = "Total ticket supply must be a positive number.";

    // Image validation (optional)
    if (imageFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        newErrors.imageUrl = "Image file must be smaller than 5MB.";
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        newErrors.imageUrl = "Image must be JPEG, PNG, WebP, or GIF format.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous image errors
      if (errors.imageUrl) {
        setErrors({ ...errors, imageUrl: undefined });
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const eventDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const startTime = Math.floor(eventDate.getTime());
    const endTime = Math.floor(endDate.getTime());
    const ticketPrice =
      Number.parseFloat(ticketPriceString) * 10 ** SUI_DECIMALS;
    const totalTickets = Number.parseInt(totalTicketsString, 10);

    const eventDataToSubmit: EventCreationData = {
      name: eventCreationData.name,
      description: eventCreationData.description,
      venue: eventCreationData.venue,
      startTime,
      endTime,
      ticketPrice,
      totalTickets,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : "",
    };

    let success = false;
    if (onCreateEvent) {
      success = await onCreateEvent(eventDataToSubmit);
    } else {
      // Default simulation if no prop provided
      await new Promise((resolve) => setTimeout(resolve, 2000));
      success = Math.random() > 0.2; // 80% success
    }

    setIsSubmitting(false);
    if (success) {
      // Show success toast
      toast({
        title: "Event Created Successfully!",
        description: `"${eventCreationData.name}" has been created and is now live.`,
        variant: "default",
      });
      // Reset form and close modal immediately
      setEventCreationData({
        name: "",
        description: "",
        venue: "",
        startTime: 0,
        endTime: 0,
        ticketPrice: 0,
        totalTickets: 0,
        imageUrl: "",
      });
      setImagePreview(null);
      setImageFile(null);
      setStartDateTime("");
      setEndDateTime("");
      setTicketPriceString("");
      setTotalTicketsString("");
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    } else {
      setErrors({ general: "Failed to create event. Please try again." });
      // Show error toast
      toast({
        title: "Event Creation Failed",
        description:
          "There was an error creating your event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "startDateTime") {
      setStartDateTime(value);
    } else if (name === "endDateTime") {
      setEndDateTime(value);
    } else if (name === "ticketPrice") {
      setTicketPriceString(value);
    } else if (name === "totalTickets") {
      setTotalTicketsString(value);
    } else {
      setEventCreationData({ ...eventCreationData, [name]: value });
    }

    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
    if (errors.general) {
      setErrors({ ...errors, general: undefined });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form when closing
      setEventCreationData({
        name: "",
        description: "",
        venue: "",
        startTime: 0,
        endTime: 0,
        ticketPrice: 0,
        totalTickets: 0,
        imageUrl: "",
      });
      setImagePreview(null);
      setImageFile(null);
      setStartDateTime("");
      setEndDateTime("");
      setTicketPriceString("");
      setTotalTicketsString("");
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl bg-ocean text-cloud border-sea max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sea text-2xl">
            Create New Event
          </DialogTitle>
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
                  src={
                    imagePreview ||
                    "/placeholder.svg?height=200&width=400&query=event+preview"
                  }
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
                <p className="text-aqua text-sm mb-1">
                  Click to upload an image
                </p>
                <p className="text-aqua text-xs opacity-60">
                  JPEG, PNG, WebP, or GIF (max 5MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
            {errors.imageUrl && (
              <p className="text-sm text-red-400">{errors.imageUrl}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-aqua">
                Event Name
              </Label>
              <Input
                id="name"
                name="name"
                value={eventCreationData.name}
                onChange={handleChange}
                placeholder="e.g., Sui Summer Hackathon"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue" className="text-aqua">
                Venue Name
              </Label>
              <Input
                id="venue"
                name="venue"
                value={eventCreationData.venue}
                onChange={handleChange}
                placeholder="e.g., Online or Physical Location"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.venue && (
                <p className="text-sm text-red-400">{errors.venue}</p>
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
              value={eventCreationData.description}
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
              <Label htmlFor="startDateTime" className="text-aqua">
                Event Start Date & Time
              </Label>
              <Input
                id="startDateTime"
                name="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={handleChange}
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.startTime && (
                <p className="text-sm text-red-400">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDateTime" className="text-aqua">
                Event End Date & Time
              </Label>
              <Input
                id="endDateTime"
                name="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={handleChange}
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.endTime && (
                <p className="text-sm text-red-400">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticketPrice" className="text-aqua">
                Ticket Price (SUI)
              </Label>
              <Input
                id="ticketPrice"
                name="ticketPrice"
                type="number"
                value={ticketPriceString}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0.01"
                step="0.01"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.ticketPrice && (
                <p className="text-sm text-red-400">{errors.ticketPrice}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalTickets" className="text-aqua">
                Total Ticket Supply
              </Label>
              <Input
                id="totalTickets"
                name="totalTickets"
                type="number"
                value={totalTicketsString}
                onChange={handleChange}
                placeholder="e.g., 100"
                min="1"
                step="1"
                className="bg-deep-ocean border-sea text-cloud focus:ring-sea"
              />
              {errors.totalTickets && (
                <p className="text-sm text-red-400">{errors.totalTickets}</p>
              )}
            </div>
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
              className="flex-1 bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
