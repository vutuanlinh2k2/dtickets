"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, Wallet, Users, Calendar, Ticket } from "lucide-react"
import { useAppState } from "@/components/AppStateProvider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export default function HeaderClient() {
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet } = useAppState()

  const handleConnect = () => {
    // Simulate wallet connection
    const mockAddress = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`
    connectWallet(mockAddress)
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const truncatedAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : ""

  return (
    <header className="bg-ocean border-b border-sea p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-sea hover:text-aqua transition-all duration-300 hover:drop-shadow-lg"
        >
          SuiTickets
        </Link>
        <nav className="space-x-6 flex items-center">
          <Link
            href="/"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Calendar className="mr-1 h-4 w-4" />
            All Events
          </Link>
          <Link
            href="/my-tickets"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Ticket className="mr-1 h-4 w-4" />
            My Tickets
          </Link>
          <Link
            href="/my-events"
            className="text-aqua hover:text-sea transition-all duration-300 flex items-center hover:drop-shadow-md"
          >
            <Users className="mr-1 h-4 w-4" />
            My Events
          </Link>

          {/* Wallet Connection */}
          {isWalletConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-ocean text-aqua border-sea hover:bg-sea hover:text-deep-ocean hover:border-aqua transition-all duration-300"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {truncatedAddress}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-ocean text-aqua border-sea">
                <DropdownMenuLabel className="text-aqua">Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sea" />
                <DropdownMenuItem className="cursor-pointer hover:bg-sea hover:text-deep-ocean">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-sea hover:text-deep-ocean">
                  <Calendar className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sea" />
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  className="cursor-pointer hover:bg-sea hover:text-deep-ocean"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-sea text-deep-ocean hover:bg-aqua hover:text-ocean transition-all duration-300"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
