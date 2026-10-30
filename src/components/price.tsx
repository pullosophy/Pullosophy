import { formatPrice } from "@/lib/format";

type Props = { priceCents: number; compareAtCents: number | null; wasLabel: string; className?: string };

// Prezzo di vendita, con il prezzo prima dello sconto barrato se c'e' un'offerta.
export function Price({ priceCents, compareAtCents, wasLabel, className = "" }: Props) {
  const onSale = !!compareAtCents && compareAtCents > priceCents;
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      {onSale && (
        <s className="text-[0.75em] font-normal text-black/40">
          <span className="sr-only">{wasLabel}: </span>
          {formatPrice(compareAtCents)}
        </s>
      )}
      <span className={onSale ? "text-brand" : ""}>{formatPrice(priceCents)}</span>
    </p>
  );
}

export function discountPercent(priceCents: number, compareAtCents: number | null) {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round((1 - priceCents / compareAtCents) * 100);
}
