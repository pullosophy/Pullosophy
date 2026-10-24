import Link from "next/link";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.thanks.title };
}

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [{ id }, { t }] = await Promise.all([searchParams, getT()]);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-6xl">{t.thanks.title}</h1>
      <p>{t.thanks.text}</p>
      {id && <p className="text-sm opacity-70">{t.thanks.orderNumber} {id}</p>}
      <Link href="/" className="underline">{t.thanks.back}</Link>
    </div>
  );
}
