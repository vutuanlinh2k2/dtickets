// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

export const CONFIG = {
  NETWORK: "testnet",
  POLLING_INTERVAL_MS: parseInt(process.env.POLLING_INTERVAL_MS || "1000"),
  DTICKETS_CONTRACT: {
    packageId:
      "0x0f136657ddf47c4c31cdb5ce3a400f1c8bfff7c21fe96ea3a6f94755459080a7",
  },
};
