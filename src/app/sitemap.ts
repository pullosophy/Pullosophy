import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [games, listings] = await Promise.all([
    db.game.findMany({ where: { active: true }, select: { slug: true } }),
    db.listing.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true, game: { select: { slug: true } } },
    }),
  ]);
  return [
    ...["/spedizioni", "/condizioni-carte", "/vendi", "/termini", "/privacy", "/cookie"].map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    { url: base, changeFrequency: "daily", priority: 1 },
    ...games.map((g) => ({ url: `${base}/${g.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...listings.map((l) => ({ url: `${base}/${l.game.slug}/p/${l.id}`, lastModified: l.updatedAt, priority: 0.6 })),
  ];
}
