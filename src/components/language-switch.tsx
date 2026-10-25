import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <form action={setLocale} className="flex items-center gap-1 text-xs font-semibold">
      {(["it", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded px-1.5 py-0.5 uppercase ${l === locale ? "bg-foreground text-white" : "text-black/50 hover:text-brand"}`}
        >
          {l}
        </button>
      ))}
    </form>
  );
}
