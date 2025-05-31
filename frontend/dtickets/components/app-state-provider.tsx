"use client"

import { createContext, useState, useContext, type ReactNode, useEffect } from "react"

interface AppStateContextType {
  isWalletConnected: boolean
  walletAddress: string | null
  connectWallet: (address: string) => void
  disconnectWallet: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Effect to check localStorage on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress_sui_ticketing")
    if (storedAddress) {
      setWalletAddress(storedAddress)
      setIsWalletConnected(true)
    }
  }, [])

  const connectWallet = (address: string) => {
    console.log("AppStateProvider: Connecting wallet with address:", address)
    setIsWalletConnected(true)
    setWalletAddress(address)
    localStorage.setItem("walletAddress_sui_ticketing", address)
  }

  const disconnectWallet = () => {
    console.log("AppStateProvider: Disconnecting wallet")
    setIsWalletConnected(false)
    setWalletAddress(null)
    localStorage.removeItem("walletAddress_sui_ticketing")
  }

  return (
    <AppStateContext.Provider value={{ isWalletConnected, walletAddress, connectWallet, disconnectWallet }}>
      {children}
    </AppStateContext.Provider>
  )
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}
