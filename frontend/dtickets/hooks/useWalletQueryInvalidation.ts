import { useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook that invalidates all queries when wallet disconnects or changes
 * This ensures data consistency when users switch wallets or disconnect
 */
export function useWalletQueryInvalidation() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const previousAccountRef = useRef<string | null>(null);

  useEffect(() => {
    const currentAddress = account?.address || null;
    const previousAddress = previousAccountRef.current;

    // If wallet disconnected (had account, now don't)
    if (previousAddress && !currentAddress) {
      queryClient.invalidateQueries();
      queryClient.clear(); // Optional: also clear the cache completely
    }
    // If wallet changed (different address)
    else if (
      previousAddress &&
      currentAddress &&
      previousAddress !== currentAddress
    ) {
      queryClient.invalidateQueries();
    }
    // If wallet connected for the first time (no previous, now has account)
    else if (!previousAddress && currentAddress) {
      queryClient.invalidateQueries();
    }

    // Update the ref with current address
    previousAccountRef.current = currentAddress;
  }, [account?.address, queryClient]);
}
