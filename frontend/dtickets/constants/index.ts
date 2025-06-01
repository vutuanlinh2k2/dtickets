export enum QueryKey {
  AllEvents = "allEvents",
  MyTickets = "myTickets",
  MyEvents = "myEvents",
  MyListedTickets = "myListedTickets",
  ResaleMarket = "resaleMarket",
}

export const DTICKETS_PACKAGE_ID =
  process.env.NEXT_PUBLIC_DTICKETS_PACKAGE_ID ?? "";
export const API_ENDPOINT = (
  process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:3001/api"
).replace(/\/$/, "");
