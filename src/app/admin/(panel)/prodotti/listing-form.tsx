"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { saveListing } from "@/app/actions/admin";
import { conditionLabels, languageLabels, sealedLabels } from "@/lib/labels";
import { ImageUploader } from "./image-uploader";

type Option = { id: string; name: string };
type CardOption = {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  imageSmall: string | null;
  cmTrendCents: number | null;
  cmAvgCents: number | null;
  cmLowCents: number | null;
  cmUrl: string | null;
  cmUpdatedAt: string | null;
};
const eur = (c: number) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
type SealedOption = { key: string; sealedType: string; label: string; title: string; image: string | null; images: string[] };
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
  releaseDate: string; // yyyy-mm-dd o vuoto
};

const field = "mt-1 w-full rounded border border-black/20 bg-transparent px-3 py-2";

export function ListingForm({ games, sets, initial }: { games: Option[]; sets: Option[]; initial: ListingValues }) {
  const [state, action, pending] = useActionState(saveListing, {});
  const [kind, setKind] = useState(initial.kind);
  const [setId, setSetId] = useState(initial.setId);
  const [cardId, setCardId] = useState(initial.cardId);
  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(initial.price);
  const [cards, setCards] = useState<CardOption[]>([]);
  const [sealedType, setSealedType] = useState(initial.sealedType);
  const [sealed, setSealed] = useState<SealedOption[]>([]);
  const [sealedKey, setSealedKey] = useState("");

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

  // Lista dei sigillati standard dell'espansione (busta, box, ETB, ...).
  useEffect(() => {
    if (!setId) return setSealed([]);
    let cancelled = false;
    fetch(`/admin/sigillati?setId=${encodeURIComponent(setId)}`)
      .then((r) => r.json())
      .then((data: SealedOption[]) => !cancelled && setSealed(data));
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const card = cards.find((c) => c.id === cardId);
  const sealedPick = sealed.find((s) => s.key === sealedKey);
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
        <select name="setId" value={setId} onChange={(e) => { setSetId(e.target.value); setCardId(""); setSealedKey(""); }} className={field}>
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
                {c.number} · {c.name}{c.rarity ? ` (${c.rarity})` : ""}{c.cmTrendCents ? ` · CM ${eur(c.cmTrendCents)}` : ""}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {card?.imageSmall && <img src={card.imageSmall} alt={card.name} className="h-40 rounded" />}
            {card?.cmTrendCents && (
              <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Cardmarket (Near Mint)</p>
                <p>Trend <strong>{eur(card.cmTrendCents)}</strong></p>
                {card.cmAvgCents && <p>Media vendite {eur(card.cmAvgCents)}</p>}
                {card.cmLowCents && <p>Minimo {eur(card.cmLowCents)}</p>}
                <button
                  type="button"
                  onClick={() => setPrice((card.cmTrendCents! / 100).toFixed(2))}
                  className="mt-2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-white"
                >
                  Usa il trend come prezzo
                </button>
                <p className="mt-2 text-xs opacity-60">
                  {card.cmUpdatedAt && `Aggiornato ${new Date(card.cmUpdatedAt).toLocaleDateString("it-IT")}. `}
                  {card.cmUrl && (
                    <a href={card.cmUrl} target="_blank" rel="noopener noreferrer" className="underline">Apri su Cardmarket</a>
                  )}
                </p>
              </div>
            )}
          </div>
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
          <span className="text-sm opacity-70">Prodotto</span>
          <select
            value={sealedKey}
            onChange={(e) => {
              const pick = sealed.find((s) => s.key === e.target.value);
              setSealedKey(e.target.value);
              if (!pick) return;
              setSealedType(pick.sealedType);
              // Sovrascrive il titolo solo se vuoto o ancora quello proposto da una scelta precedente.
              if (pick.title && (!title || sealed.some((s) => s.title === title))) setTitle(pick.title);
            }}
            className={field}
          >
            <option value="">{setId ? "— scegli dalla lista —" : "Prima scegli l'espansione"}</option>
            {sealed.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {sealedPick?.image && <img src={sealedPick.image} alt="" className="mt-2 h-16 object-contain" />}
          <span className="mt-1 block text-xs opacity-60">
            Carica le foto del prodotto qui sotto: senza, nel negozio si vede il logo dell&apos;espansione. Le foto caricate
            una volta vengono riproposte quando crei lo stesso prodotto (altra lingua, ristock).
          </span>
        </label>
      )}

      {kind === "SEALED" && (
        <label className="block">
          <span className="text-sm opacity-70">Tipo di sigillato</span>
          <select name="sealedType" value={sealedType} onChange={(e) => setSealedType(e.target.value)} className={field}>
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
          <input name="price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className={field} />
        </label>
        <label className="block">
          <span className="text-sm opacity-70">Quantità</span>
          <input name="stock" type="number" min="0" defaultValue={initial.stock} required className={field} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm opacity-70">Data di uscita (solo per i preordini)</span>
        <input name="releaseDate" type="date" defaultValue={initial.releaseDate} className={field} />
        <span className="mt-1 block text-xs opacity-60">
          Con una data futura il prodotto compare in home sotto “In arrivo” con l&apos;etichetta Preordine. Lascia vuoto per i prodotti disponibili.
        </span>
      </label>

      <ImageUploader initial={initial.images} suggested={kind === "SEALED" ? (sealedPick?.images ?? []) : []} />

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
