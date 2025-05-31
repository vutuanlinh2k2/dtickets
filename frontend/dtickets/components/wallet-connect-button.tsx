"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  // Check localStorage on mount to sync with AppStateProvider
  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress_sui_ticketing")
    if (storedAddress) {
      setWalletAddress(storedAddress)
      setIsConnected(true)
    }
  }, [])

  const handleConnect = () => {
    // Simulate wallet connection
    const mockAddress = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`
    setWalletAddress(mockAddress)
    setIsConnected(true)

    // Call the parent's onConnect handler (which will update AppStateProvider)
    if (onConnect) {
      onConnect(mockAddress)
    }
  }

  const handleDisconnect = () => {
    setWalletAddress("")
    setIsConnected(false)

    // Call the parent's onDisconnect handler (which will update AppStateProvider)
    if (onDisconnect) {
      onDisconnect()
    }
  }

  const truncatedAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : ""

  return (
    <>
      {isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-ocean text-aqua border-sea hover:bg-sea hover:text-deep-ocean">
              <Wallet className="mr-2 h-4 w-4" />
              {truncatedAddress}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-ocean text-aqua border-sea">
            <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer hover:bg-sea hover:text-deep-ocean">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={handleConnect} className="bg-sea text-deep-ocean hover:bg-opacity-80">
          <LogIn className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      )}
    </>
  )
}

// Default props for Next.js
WalletConnectButton.defaultProps = {
  onConnect: (address: string) => console.log("Connected:", address),
  onDisconnect: () => console.log("Disconnected"),
}
