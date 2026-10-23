import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pullosophy", template: "%s · Pullosophy" },
  description: "Carte singole, prodotti sigillati e carte gradate Pokémon. Spedizioni in tutta Europa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">Pullosophy</Link>
            <Link href="/pokemon">Pokémon</Link>
            <Link href="/pokemon?tipo=sealed">Sigillati</Link>
            <Link href="/pokemon?tipo=graded">Gradate</Link>
            <Link href="/carrello" className="ml-auto">Carrello</Link>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-black/10 dark:border-white/10 py-6 text-center text-sm opacity-70">
          Pullosophy · Spedizioni in Italia e in tutta l&apos;Unione Europea
        </footer>
      </body>
    </html>
  );
}
