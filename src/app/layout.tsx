import { company } from "@/lib/company";
import type { Metadata } from "next";
import Link from "next/link";
import { Bebas_Neue, Inter } from "next/font/google";
import { Logo } from "@/components/logo";
import { cartCount } from "@/lib/cart-count";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Pullosophy · Carte collezionabili · Mantova", template: "%s · Pullosophy" },
  description:
    "Carte Pokémon singole, prodotti sigillati e carte gradate. Da Mantova, spedizioni in tutta Europa. Aprire un'altra busta è una scelta di vita.",
};

const nav = [
  { href: "/pokemon?tipo=single", label: "Singole" },
  { href: "/pokemon?tipo=sealed", label: "Sigillati" },
  { href: "/pokemon?tipo=graded", label: "Gradate" },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const count = await cartCount();
  return (
    <html lang="it" className={`${inter.variable} ${bebas.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <div className="bg-foreground text-white text-center text-xs py-1.5 px-4">
          Spedizioni in tutta Europa · Gratis in Italia sopra 100 €
        </div>
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
            <Logo />
            <nav className="hidden sm:flex items-center gap-5 text-sm font-medium">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-brand">
                  {n.label}
                </Link>
              ))}
              <span className="text-black/30" title="In arrivo">One Piece</span>
            </nav>
            <Link
              href="/carrello"
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-brand"
            >
              Carrello
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs">{count}</span>
              )}
            </Link>
          </div>
          <nav className="sm:hidden flex gap-5 overflow-x-auto px-4 pb-2 text-sm font-medium">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-brand">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 bg-foreground text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <p className="font-display text-3xl">
                PULL<span className="text-brand">OSOPHY</span>
              </p>
              <p className="text-sm text-white/70">Aprire un&apos;altra busta è una scelta di vita.</p>
            </div>
            <div className="text-sm space-y-2">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">Negozio</p>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block hover:text-brand">
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="text-sm space-y-2 text-white/80">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">Info</p>
              <p>Mantova, Italia</p>
              <Link href="/spedizioni" className="block hover:text-brand">Spedizioni e resi</Link>
              <Link href="/condizioni-carte" className="block hover:text-brand">Condizioni delle carte</Link>
              <Link href="/vendi" className="block hover:text-brand">Vendi le tue carte</Link>
              <a href={`mailto:${company.email}`} className="block hover:text-brand">{company.email}</a>
            </div>
            <div className="text-sm space-y-2 text-white/80">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">Legale</p>
              <Link href="/termini" className="block hover:text-brand">Termini di vendita e recesso</Link>
              <Link href="/privacy" className="block hover:text-brand">Privacy</Link>
              <Link href="/cookie" className="block hover:text-brand">Cookie</Link>
              <p className="pt-2 text-xs text-white/50">{company.legalName} · P. IVA {company.vat}</p>
            </div>
          </div>
          <p className="border-t border-white/10 py-4 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Pullosophy · Pokémon è un marchio di Nintendo/Creatures/GAME FREAK, non affiliato.
          </p>
        </footer>
      </body>
    </html>
  );
}
