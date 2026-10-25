import type { Locale } from "@/lib/i18n";

// Nome dell'espansione nella lingua del sito: italiano se TCGdex lo fornisce, altrimenti l'inglese.
export type NamedSet = { name: string; nameIt?: string | null };
export function setName(set: NamedSet | null | undefined, locale: Locale): string {
  if (!set) return "";
  return (locale === "it" && set.nameIt) || set.name;
}
