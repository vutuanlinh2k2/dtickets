// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
