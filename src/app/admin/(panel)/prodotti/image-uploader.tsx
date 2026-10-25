"use client";

import { useRef, useState } from "react";

// Riduce la foto lato client (max 1600px, JPEG) così dal telefono si carica in fretta.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.88));
}

// `suggested`: foto già caricate su un prodotto uguale (es. stesso ETB in un'altra lingua), riusabili con un tap.
export function ImageUploader({ initial, suggested = [] }: { initial: string; suggested?: string[] }) {
  const [urls, setUrls] = useState(initial.split(/\s+/).filter(Boolean));
  const missing = suggested.filter((u) => !urls.includes(u));
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const f of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const body = new FormData();
        body.append("file", await shrink(f), "foto.jpg");
        const r = await fetch("/admin/upload", { method: "POST", body });
        const data = (await r.json()) as { url?: string; error?: string };
        if (!r.ok || !data.url) throw new Error(data.error ?? "Caricamento fallito");
        setUrls((u) => [...u, data.url!]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Caricamento fallito");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) =>
    setUrls((u) => {
      const j = i + dir;
      if (j < 0 || j >= u.length) return u;
      const copy = [...u];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="space-y-2">
      <span className="text-sm opacity-70">Foto (la prima è quella principale). Per le gradate metti foto reali fronte e retro.</span>
      <input type="hidden" name="images" value={urls.join("\n")} />
      {missing.length > 0 && (
        <button
          type="button"
          onClick={() => setUrls((u) => [...u, ...missing])}
          className="flex items-center gap-2 rounded-lg border border-dashed border-brand bg-brand/5 px-3 py-2 text-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={missing[0]} alt="" className="h-10 w-8 rounded object-cover" />
          <span>{missing.length === 1 ? "Usa la foto già caricata" : `Usa le ${missing.length} foto già caricate`} per questo prodotto</span>
        </button>
      )}
      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <li key={u} className="relative w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-[3/4] w-24 rounded border border-black/10 object-cover" />
              <div className="mt-1 flex justify-between text-xs">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30">←</button>
                <button type="button" onClick={() => setUrls(urls.filter((_, k) => k !== i))} className="text-red-600">Elimina</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} className="disabled:opacity-30">→</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white">
          {busy ? `Caricamento (${busy})…` : "Scatta o scegli foto"}
          <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} disabled={busy > 0} />
        </label>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            const u = prompt("Incolla il link di una foto (https://…)");
            if (u && /^https:\/\//.test(u)) setUrls((x) => [...x, u.trim()]);
          }}
        >
          Aggiungi da link
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
