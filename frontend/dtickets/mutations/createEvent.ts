// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { DTICKETS_PACKAGE_ID, QueryKey } from "../constants";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";
import { EventCreationData } from "../types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

/**
 * Builds and executes the PTB to create an escrow.
 */
export function useCreateEventMutation() {
  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();
  const executeTransaction = useTransactionExecution(
    "Event created successfully!",
    "Failed to create event!"
  );

  return useMutation({
    mutationFn: async (eventData: EventCreationData) => {
      if (!currentAccount?.address)
        throw new Error("You need to connect your wallet!");

      const txb = new Transaction();
      txb.moveCall({
        target: `${DTICKETS_PACKAGE_ID}::dtickets::create_event`,
        arguments: [
          txb.pure.string(eventData.name),
          txb.pure.string(eventData.description),
          txb.pure.string(eventData.venue),
          txb.pure.string(eventData.imageUrl),
          txb.pure.u64(eventData.startTime),
          txb.pure.u64(eventData.endTime),
          txb.pure.u64(eventData.ticketPrice),
          txb.pure.u64(eventData.totalTickets),
          txb.object(SUI_CLOCK_OBJECT_ID),
        ],
        typeArguments: [],
      });

      return executeTransaction(txb);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.MyEvents] });
    },
  });
}
