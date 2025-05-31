import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { BigNumber } from "bignumber.js";

export default function useSuiBalance() {
  const account = useCurrentAccount();

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    { enabled: !!account }
  );

  if (!account) return null;
  return balance?.totalBalance ? new BigNumber(balance.totalBalance) : null;
}
