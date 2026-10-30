"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { saveSetLogo } from "@/app/actions/admin";

// Logo dell'espansione in admin: anteprima, caricamento di un PNG/JPG, rimozione.
export function SetLogo({ setId, logoUrl }: { setId: string; logoUrl: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = (url: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("setId", setId);
      fd.set("logoUrl", url);
      await saveSetLogo(fd);
      router.refresh();
    });

  const upload = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", f, f.name);
      const r = await fetch("/admin/upload", { method: "POST", body });
      const data = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !data.url) throw new Error(data.error ?? "Caricamento fallito");
      save(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caricamento fallito");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const working = busy || pending;
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-20 shrink-0 place-items-center rounded border border-dashed border-black/15 bg-white">
        {logoUrl ? (
          <SafeImage src={logoUrl} alt="" shape="logo" className="max-h-8 max-w-[4.5rem] object-contain" fallback={<span className="text-[10px] opacity-50">no logo</span>} />
        ) : (
          <span className="text-[10px] opacity-50">no logo</span>
        )}
      </span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files)} />
      <button
        type="button"
        disabled={working}
        onClick={() => input.current?.click()}
        className="rounded border border-black/20 px-2 py-1 text-xs disabled:opacity-50"
        title="Carica il logo dell'espansione (PNG con sfondo trasparente, largo)"
      >
        {working ? "…" : logoUrl ? "Cambia logo" : "Carica logo"}
      </button>
      {logoUrl && (
        <button type="button" disabled={working} onClick={() => save("")} className="text-xs opacity-60 hover:opacity-100 disabled:opacity-30" title="Togli il logo">
          ✕
        </button>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
