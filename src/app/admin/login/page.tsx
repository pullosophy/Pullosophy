import { login } from "@/app/actions/admin";

export const metadata = { title: "Accesso admin", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <form action={login} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Accesso admin</h1>
      {!process.env.ADMIN_PASSWORD && (
        <p className="text-sm text-red-600">Manca la variabile ADMIN_PASSWORD su Vercel.</p>
      )}
      {errore && <p className="text-sm text-red-600">Password sbagliata.</p>}
      <input
        type="password"
        name="password"
        required
        autoFocus
        placeholder="Password"
        className="w-full rounded border border-black/20 bg-transparent px-3 py-2"
      />
      <button className="w-full rounded bg-foreground text-background px-5 py-2 font-medium">Entra</button>
    </form>
  );
}
