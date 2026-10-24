import Link from "next/link";
import { logout } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const links = [
  { href: "/admin", label: "Riepilogo" },
  { href: "/admin/prodotti", label: "Prodotti" },
  { href: "/admin/espansioni", label: "Espansioni" },
  { href: "/admin/ordini", label: "Ordini" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-black/10 pb-3">
        <span className="font-semibold">Admin</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">
            {l.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button className="text-sm opacity-70 hover:opacity-100">Esci</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
