"use client";

import { useActionState } from "react";
import { requestStockAlert, type StockAlertState } from "@/app/actions/stock-alerts";

type Labels = {
  title: string;
  text: string;
  placeholder: string;
  button: string;
  pending: string;
  done: string;
  errorEmail: string;
  errorGeneric: string;
};

// Form "Avvisami quando torna disponibile" mostrato al posto del tasto carrello sui prodotti esauriti.
export function RestockForm({ listingId, labels }: { listingId: string; labels: Labels }) {
  const [state, action, pending] = useActionState<StockAlertState, FormData>(requestStockAlert, {});
  if (state.ok) return <p className="rounded-2xl bg-green-600/10 px-5 py-4 text-sm font-semibold text-green-800">{labels.done}</p>;
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-muted p-5">
      <input type="hidden" name="listingId" value={listingId} />
      <p className="font-semibold">{labels.title}</p>
      <p className="text-sm text-black/60">{labels.text}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder={labels.placeholder}
          className="flex-1 rounded-full border border-line bg-white px-4 py-3 text-sm"
        />
        <button disabled={pending} className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? labels.pending : labels.button}
        </button>
      </div>
      {state.error && <p className="text-sm text-brand">{state.error === "email" ? labels.errorEmail : labels.errorGeneric}</p>}
    </form>
  );
}
