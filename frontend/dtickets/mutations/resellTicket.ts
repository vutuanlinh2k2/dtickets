// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { DTICKETS_PACKAGE_ID, QueryKey } from "../constants";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";
import { Ticket } from "../types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SUI_DECIMALS } from "@mysten/sui/utils";

/**
 * Builds and executes the PTB to create an escrow.
 */
export function useCreateEventMutation() {
  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();
  const executeTransaction = useTransactionExecution(
    "Ticket listed for resale successfully!",
    "Failed to list ticket for resale!"
  );

  return useMutation({
    mutationFn: async ({
      ticketData,
      resalePrice,
    }: {
      ticketData: Ticket;
      resalePrice: number;
    }) => {
      if (!currentAccount?.address)
        throw new Error("You need to connect your wallet!");

      const txb = new Transaction();
      txb.moveCall({
        target: `${DTICKETS_PACKAGE_ID}::dtickets::list_ticket_for_resale`,
        arguments: [
          txb.object(ticketData.id),
          txb.pure.u64(resalePrice * 10 ** SUI_DECIMALS),
        ],
        typeArguments: [],
      });

      return executeTransaction(txb);
    },

    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [QueryKey.MyTickets] });
        queryClient.invalidateQueries({ queryKey: [QueryKey.MyListedTickets] });
      }, 1_100);
    },
  });
}
