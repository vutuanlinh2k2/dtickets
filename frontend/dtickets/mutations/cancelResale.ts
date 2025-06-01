// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { DTICKETS_PACKAGE_ID, QueryKey } from "../constants";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Builds and executes the PTB to cancel a resale listing.
 */
export function useCancelResaleMutation() {
  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();
  const executeTransaction = useTransactionExecution(
    "Resale listing cancelled successfully!",
    "Failed to cancel resale listing!"
  );

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!currentAccount?.address)
        throw new Error("You need to connect your wallet!");

      const txb = new Transaction();
      txb.moveCall({
        target: `${DTICKETS_PACKAGE_ID}::dtickets::cancel_resale_listing`,
        arguments: [txb.object(listingId)],
        typeArguments: [],
      });

      return executeTransaction(txb);
    },

    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [QueryKey.MyListedTickets] });
        queryClient.invalidateQueries({ queryKey: [QueryKey.MyTickets] });
      }, 1_000);
    },
  });
}
