"use client";

import { useState } from "react";

// Immagine che prova formati alternativi (.png -> .webp -> .jpg) e, se nessuno esiste, mostra il segnaposto o sparisce.
// Serve per loghi e simboli delle espansioni: TCGdex non li ha tutti e la vecchia API potrebbe spegnersi.
// TCGdex, per un logo che non ha, risponde con il retro di una carta (immagine verticale) invece di un errore:
// con shape="logo" (orizzontale) o "symbol" (quadrato) un'immagine verticale viene trattata come mancante.
const ALT: Record<string, string[]> = { png: ["webp", "jpg"], webp: ["png", "jpg"], jpg: ["png", "webp"] };

export function SafeImage({
  src,
  alt,
  className,
  fallback = null,
  loading,
  shape,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
  shape?: "logo" | "symbol";
}) {
  const [current, setCurrent] = useState(src);
  const [tried, setTried] = useState<string[]>([]);
  const [dead, setDead] = useState(false);
  if (dead) return <>{fallback}</>;
  const onError = () => {
    const m = current.match(/\.(png|webp|jpg)$/i);
    const next = m ? ALT[m[1].toLowerCase()].find((ext) => !tried.includes(ext)) : undefined;
    if (!next) return setDead(true);
    setTried([...tried, m![1].toLowerCase(), next]);
    setCurrent(current.replace(/\.(png|webp|jpg)$/i, `.${next}`));
  };
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (shape && img.naturalHeight > img.naturalWidth * 1.1) onError();
  };
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={current} alt={alt} className={className} loading={loading} onError={onError} onLoad={onLoad} />;
}
