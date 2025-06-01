// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

export const CONFIG = {
  NETWORK: "testnet",
  POLLING_INTERVAL_MS: parseInt(process.env.POLLING_INTERVAL_MS || "1000"),
  DTICKETS_CONTRACT: {
    packageId:
      "0xd317c66e4a40cd68395ce14214bf901d2d0e780105d5a7a4df8dfd14c8ca59b8",
  },
};
