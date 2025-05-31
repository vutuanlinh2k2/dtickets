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
