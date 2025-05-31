// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

/**
 * Get a SuiClient instance for the specified network
 */
export const getClient = (network: string): SuiClient => {
  const rpcUrl = getFullnodeUrl(network as any);
  return new SuiClient({ url: rpcUrl });
};
