import { db } from "@/lib/db";

export async function GET() {
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const csv = ["email,lingua,data", ...subs.map((s) => `${s.email},${s.locale},${s.createdAt.toISOString().slice(0, 10)}`)].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=iscritti-pullosophy.csv" },
  });
}
