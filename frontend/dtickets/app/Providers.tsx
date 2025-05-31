"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWalletQueryInvalidation } from "../hooks/useWalletQueryInvalidation";

const queryClient = new QueryClient();
const networks = {
  testnet: { url: getFullnodeUrl("testnet") },
};

// Inner component that uses the wallet invalidation hook
function WalletQueryManager({ children }: { children: React.ReactNode }) {
  useWalletQueryInvalidation();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <WalletQueryManager>{children}</WalletQueryManager>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
