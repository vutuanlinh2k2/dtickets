// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { DTICKETS_PACKAGE_ID, QueryKey } from "../constants";
import { useTransactionExecution } from "@/hooks/useTransactionExecution";
import { ResaleListing } from "../types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useSuiBalance from "../hooks/useSuiBalance";
import { BigNumber } from "bignumber.js";

/**
 * Builds and executes the PTB to purchase tickets.
 */
export function usePurchaseResaleTicketMutation() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const suiBalance = useSuiBalance();
  const queryClient = useQueryClient();
  const executeTransaction = useTransactionExecution(
    "Resale ticket purchased successfully!",
    "Failed to purchase resale ticket!"
  );

  return useMutation({
    mutationFn: async (resaleListing: ResaleListing) => {
      if (!currentAccount?.address)
        throw new Error("You need to connect your wallet!");
      if (!suiBalance) throw new Error("You need to have SUI in your wallet!");
      if (suiBalance.lt(resaleListing.listingPrice))
        throw new Error("You need to have enough SUI in your wallet!");

      const txb = new Transaction();

      const { data: coinObjects } = await client.getCoins({
        owner: currentAccount.address,
      });

      // Sum balances until exceeding ticket price
      let cumulativeBalance = new BigNumber(0);
      const mergeCoins: string[] = [];
      let i = 0;
      while (
        i < coinObjects.length &&
        cumulativeBalance.lt(
          new BigNumber(resaleListing.listingPrice.toString())
        )
      ) {
        cumulativeBalance = cumulativeBalance.plus(
          new BigNumber(coinObjects[i].balance)
        );
        mergeCoins.push(coinObjects[i].coinObjectId);
        i++;
      }

      // Merge coins if necessary
      let primaryCoin: string;
      if (mergeCoins.length > 1) {
        primaryCoin = mergeCoins[0];
        txb.mergeCoins(
          txb.object(primaryCoin),
          mergeCoins.slice(1).map((id) => txb.object(id))
        );
      } else {
        primaryCoin = mergeCoins[0];
      }

      const [splitCoin] = txb.splitCoins(
        coinObjects.length > 1 ? primaryCoin : txb.gas,
        [resaleListing.listingPrice]
      );

      txb.moveCall({
        target: `${DTICKETS_PACKAGE_ID}::dtickets::purchase_resold_ticket`,
        arguments: [
          txb.object(resaleListing.id),
          txb.object(splitCoin),
          txb.pure.address(currentAccount.address),
        ],
        typeArguments: [],
      });

      return executeTransaction(txb);
    },

    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [QueryKey.ResaleMarket] });
        queryClient.invalidateQueries({ queryKey: [QueryKey.MyTickets] });
      }, 1_100);
    },
  });
}
