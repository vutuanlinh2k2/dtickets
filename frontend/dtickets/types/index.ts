export type EventCreationData = {
  name: string;
  description: string;
  venue: string;
  startTime: number;
  endTime: number;
  ticketPrice: number;
  totalTickets: number;
  imageUrl: string;
};

export type TicketPurchaseData = {
  eventId: string;
  pricePerTicket: number;
  recipients: string[];
};

export type Event = {
  id: string;
  createdAt: string;
  description: string;
  endTime: string;
  imgUrl: string;
  name: string;
  organizer: string;
  startTime: string;
  ticketPrice: string;
  tickets: [];
  ticketsSold: number;
  totalTickets: number;
  updatedAt: string;
  venue: string;
};

export type Ticket = {
  id: string;
  eventId: string;
  eventName: string;
  eventStartTime: string;
  eventEndTime: string;
  venue: string;
  ticketNumber: string;
  purchaseTime: string;
  imageUrl?: string; // Add optional image URL
  isListedForSale: boolean;
};
