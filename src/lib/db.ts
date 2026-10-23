import { PrismaClient } from "@prisma/client";

// Un solo client anche con l'hot reload in sviluppo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
