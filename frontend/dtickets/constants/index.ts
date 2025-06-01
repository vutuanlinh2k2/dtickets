export enum QueryKey {
  AllEvents = "allEvents",
  MyTickets = "myTickets",
  MyEvents = "myEvents",
}

export const DTICKETS_PACKAGE_ID =
  process.env.NEXT_PUBLIC_DTICKETS_PACKAGE_ID ?? "";
export const API_ENDPOINT = "http://localhost:3001/api/"; // TODO: update this later
