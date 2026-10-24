// Accesso admin con una sola password (ADMIN_PASSWORD). Il cookie contiene un hash
// della password, quindi cambiarla su Vercel invalida tutte le sessioni.
export const ADMIN_COOKIE = "admin";

export async function adminToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  const bytes = new TextEncoder().encode(`pullosophy-admin:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
