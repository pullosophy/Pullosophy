"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { saveListing } from "@/app/actions/admin";
import { conditionLabels, languageLabels, sealedLabels } from "@/lib/labels";
import { ImageUploader } from "./image-uploader";

type Option = { id: string; name: string };
type CardOption = { id: string; name: string; number: string; rarity: string | null; imageSmall: string | null };
export type ListingValues = {
  id?: string;
  kind: "SINGLE" | "SEALED" | "GRADED";
  gameId: string;
  setId: string;
  cardId: string;
  title: string;
  language: string;
  condition: string;
  sealedType: string;
  grader: string;
  grade: string;
  certNumber: string;
  price: string;
  stock: string;
  images: string;
  published: boolean;
};

const field = "mt-1 w-full rounded border border-black/20 bg-transparent px-3 py-2";

export function ListingForm({ games, sets, initial }: { games: Option[]; sets: Option[]; initial: ListingValues }) {
  const [state, action, pending] = useActionState(saveListing, {});
  const [kind, setKind] = useState(initial.kind);
  const [setId, setSetId] = useState(initial.setId);
  const [cardId, setCardId] = useState(initial.cardId);
  const [title, setTitle] = useState(initial.title);
  const [cards, setCards] = useState<CardOption[]>([]);

  useEffect(() => {
    if (!setId) return setCards([]);
    let cancelled = false;
    fetch(`/admin/carte?setId=${encodeURIComponent(setId)}`)
      .then((r) => r.json())
      .then((data: CardOption[]) => !cancelled && setCards(data));
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const card = cards.find((c) => c.id === cardId);
  const setName = sets.find((s) => s.id === setId)?.name;

  return (
    <form
      // Invio manuale: con action={...} React svuota i campi dopo un errore di validazione.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="max-w-xl space-y-4"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <label className="block">
        <span className="text-sm opacity-70">Tipo</span>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as ListingValues["kind"])} className={field}>
          <option value="SINGLE">Carta singola</option>
          <option value="SEALED">Prodotto sigillato</option>
          <option value="GRADED">Carta gradata</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Gioco</span>
        <select name="gameId" defaultValue={initial.gameId} className={field}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Espansione</span>
        <select name="setId" value={setId} onChange={(e) => { setSetId(e.target.value); setCardId(""); }} className={field}>
          <option value="">—</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>

      {kind !== "SEALED" && (
        <label className="block">
          <span className="text-sm opacity-70">Carta</span>
          <select
            name="cardId"
            value={cardId}
            onChange={(e) => {
              setCardId(e.target.value);
              const c = cards.find((x) => x.id === e.target.value);
              if (c && !title) setTitle(`${c.name} ${c.number}${setName ? ` · ${setName}` : ""}`);
            }}
            className={field}
          >
            <option value="">{setId && cards.length === 0 ? "Nessuna carta: importale da Espansioni" : "—"}</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number} · {c.name}{c.rarity ? ` (${c.rarity})` : ""}
              </option>
            ))}
          </select>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {card?.imageSmall && <img src={card.imageSmall} alt={card.name} className="mt-2 h-40 rounded" />}
        </label>
      )}

      <label className="block">
        <span className="text-sm opacity-70">Titolo mostrato nel negozio</span>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={field} />
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Lingua</span>
        <select name="language" defaultValue={initial.language} className={field}>
          {Object.entries(languageLabels).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </label>

      {kind === "SINGLE" && (
        <label className="block">
          <span className="text-sm opacity-70">Condizione</span>
          <select name="condition" defaultValue={initial.condition} className={field}>
            <option value="">—</option>
            {Object.entries(conditionLabels).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </label>
      )}

      {kind === "SEALED" && (
        <label className="block">
          <span className="text-sm opacity-70">Tipo di sigillato</span>
          <select name="sealedType" defaultValue={initial.sealedType} className={field}>
            <option value="">—</option>
            {Object.entries(sealedLabels).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </label>
      )}

      {kind === "GRADED" && (
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm opacity-70">Ente</span>
            <select name="grader" defaultValue={initial.grader} className={field}>
              <option value="">—</option>
              {["PSA", "BGS", "CGC", "OTHER"].map((g) => (
                <option key={g} value={g}>{g === "OTHER" ? "Altro" : g}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm opacity-70">Voto</span>
            <input name="grade" type="number" step="0.5" min="1" max="10" defaultValue={initial.grade} className={field} />
          </label>
          <label className="block">
            <span className="text-sm opacity-70">N. certificato</span>
            <input name="certNumber" defaultValue={initial.certNumber} className={field} />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm opacity-70">Prezzo (€, IVA inclusa)</span>
          <input name="price" type="number" step="0.01" min="0.01" defaultValue={initial.price} required className={field} />
        </label>
        <label className="block">
          <span className="text-sm opacity-70">Quantità</span>
          <input name="stock" type="number" min="0" defaultValue={initial.stock} required className={field} />
        </label>
      </div>

      <ImageUploader initial={initial.images} />

      <label className="flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={initial.published} />
        <span>Online nel negozio</span>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-foreground text-background px-5 py-2 font-medium disabled:opacity-50">
        {pending ? "Salvo…" : "Salva"}
      </button>
    </form>
  );
}
