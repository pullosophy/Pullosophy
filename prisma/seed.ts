import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  for (const game of [
    { slug: "pokemon", name: "Pokémon" },
    { slug: "one-piece", name: "One Piece", active: false },
  ]) {
    await db.game.upsert({ where: { slug: game.slug }, update: {}, create: game });
  }

  const zones = [
    { name: "Italia", countries: ["IT"], baseCents: 500, freeOverCents: 10000 },
    {
      name: "Unione Europea",
      countries: ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"],
      baseCents: 1200,
      freeOverCents: 20000,
    },
  ];
  if ((await db.shippingZone.count()) === 0) {
    await db.shippingZone.createMany({ data: zones });
  }
}

main().finally(() => db.$disconnect());
