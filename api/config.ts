// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import dotenv from "dotenv";
dotenv.config();

const packageId = process.env.DTICKETS_PACKAGE_ID;
if (!packageId) {
  throw new Error("DTICKETS_PACKAGE_ID is not set");
}

export const CONFIG = {
  NETWORK: "testnet",
  POLLING_INTERVAL_MS: 1000, // poll every 1 sec
  DTICKETS_CONTRACT: {
    packageId,
  },
};
