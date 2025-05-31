"use client"

import { Loader2 } from "lucide-react"

interface ProcessingOverlayProps {
  isVisible: boolean
  message?: string
}

export default function ProcessingOverlay({
  isVisible,
  message = "Processing transaction...",
}: ProcessingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-ocean border border-sea rounded-lg p-8 max-w-sm mx-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-sea mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-cloud mb-2">Please Wait</h3>
        <p className="text-aqua text-sm">{message}</p>
        <p className="text-aqua text-xs mt-2 opacity-75">Do not close this window</p>
      </div>
    </div>
  )
}
