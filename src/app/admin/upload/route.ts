import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Carica una foto su Vercel Blob e restituisce l'URL pubblico.
// Richiede BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob).
export async function POST(req: Request) {
  const jar = await cookies();
  const token = await adminToken();
  if (!token || jar.get(ADMIN_COOKIE)?.value !== token) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Caricamento non configurato: manca BLOB_READ_WRITE_TOKEN su Vercel (Storage → Create → Blob)." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "File non valido" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Foto troppo grande (max 8 MB)" }, { status: 400 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`listings/${Date.now()}.${ext}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
  return NextResponse.json({ url: blob.url });
}
