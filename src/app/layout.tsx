import { Analytics } from "@vercel/analytics/next";
import { companyDataReady, whatsappUrl, company, previewMode, socials } from "@/lib/company";
import type { Metadata } from "next";
import Link from "next/link";
import { Bebas_Neue, Inter } from "next/font/google";
import { Logo } from "@/components/logo";
import { cartCount } from "@/lib/cart-count";
import { getT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/language-switch";
import { WelcomePopup } from "@/components/welcome-popup";
import { TopStrip, SocialIcon } from "@/components/top-strip";
import { WELCOME_PERCENT } from "@/lib/welcome";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t.meta.title, template: "%s · Pullosophy" },
    description: t.meta.description,
    // Verifica proprietà per Google Search Console (meta tag), se impostata su Vercel.
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [count, { locale, t }] = await Promise.all([cartCount(), getT()]);
  const nav = [
    { href: "/pokemon?tipo=single", label: t.nav.singles },
    { href: "/pokemon?tipo=sealed", label: t.nav.sealed },
    { href: "/pokemon?tipo=graded", label: t.nav.graded },
  ];
  return (
    <html lang={locale} className={`${inter.variable} ${bebas.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        {previewMode && (
          <div className="bg-brand px-4 py-1.5 text-center text-xs font-semibold text-white">{t.previewBanner}</div>
        )}
        <TopStrip messages={[t.topbar, ...t.trust.items.map((i) => i.title), t.home.tagline]} />
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
            <Logo />
            <nav className="hidden sm:flex items-center gap-5 text-sm font-medium">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-brand">
                  {n.label}
                </Link>
              ))}
              <span className="text-black/30" title={t.nav.comingSoon}>One Piece</span>
            </nav>
            <form action="/pokemon" className="ml-auto hidden md:block">
              <input
                type="search"
                name="q"
                placeholder={t.nav.search}
                aria-label={t.nav.search}
                className="w-44 rounded-full border border-line bg-muted px-4 py-1.5 text-sm focus:w-64 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
              />
            </form>
            <div className="hidden sm:block">
              <LanguageSwitch locale={locale} />
            </div>
            <Link
              href="/carrello"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-brand"
            >
              {t.nav.cart}
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs">{count}</span>
              )}
            </Link>
          </div>
          <nav className="sm:hidden flex items-center gap-5 overflow-x-auto px-4 pb-2 text-sm font-medium">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-brand">
                {n.label}
              </Link>
            ))}
            <div className="ml-auto">
              <LanguageSwitch locale={locale} />
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <WelcomePopup labels={t.welcome} percent={WELCOME_PERCENT} />
        <footer className="mt-16 bg-foreground text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <p className="font-display text-3xl">
                PULL<span className="text-brand">OSOPHY</span>
              </p>
              <p className="text-sm text-white/70">{t.home.tagline}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.footer.follow}: ${s.name}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm hover:border-brand hover:text-brand"
                  >
                    <SocialIcon name={s.name} />
                    {s.handle}
                  </a>
                ))}
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">{t.footer.shop}</p>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block hover:text-brand">
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="text-sm space-y-2 text-white/80">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">{t.footer.info}</p>
              <p>{t.footer.location}</p>
              <Link href="/spedizioni" className="block hover:text-brand">{t.footer.shipping}</Link>
              <Link href="/ordine/traccia" className="block hover:text-brand">{t.footer.track}</Link>
              <Link href="/condizioni-carte" className="block hover:text-brand">{t.footer.conditions}</Link>
              <Link href="/vendi" className="block hover:text-brand">{t.footer.sell}</Link>
              <Link href="/chi-siamo" className="block hover:text-brand">{t.footer.about}</Link>
              <a href={`mailto:${company.email}`} className="block hover:text-brand">{company.email}</a>
              {whatsappUrl() && (
                <a href={whatsappUrl()!} target="_blank" rel="noopener noreferrer" className="block hover:text-brand">
                  {t.footer.whatsapp}
                </a>
              )}
            </div>
            <div className="text-sm space-y-2 text-white/80">
              <p className="font-semibold uppercase tracking-widest text-xs text-white/50">{t.footer.legal}</p>
              <Link href="/termini" className="block hover:text-brand">{t.footer.terms}</Link>
              <Link href="/privacy" className="block hover:text-brand">{t.footer.privacy}</Link>
              <Link href="/cookie" className="block hover:text-brand">{t.footer.cookie}</Link>
              {companyDataReady && <p className="pt-2 text-xs text-white/50">{company.legalName} · P. IVA {company.vat}</p>}
            </div>
          </div>
          <p className="border-t border-white/10 py-4 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Pullosophy · {t.footer.trademark}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
