import { db } from "@/lib/db";

export async function formOptions() {
  const [games, sets] = await Promise.all([
    db.game.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.cardSet.findMany({ select: { id: true, name: true }, orderBy: { releaseDate: "desc" } }),
  ]);
  return { games, sets };
}
