import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatUnixTimestamp = (timestamp: number, includeTime = true): string => {
  const date = new Date(timestamp * 1000)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
    options.hour12 = true
  }
  return date.toLocaleString("en-US", options)
}
