// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { setupListeners } from "./indexer/index";

// Start the indexer
setupListeners().catch((error) => {
  console.error("Failed to start indexer:", error);
  process.exit(1);
});
