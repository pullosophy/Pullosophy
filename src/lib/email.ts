// Invio email transazionali via Resend (https://resend.com).
// Senza RESEND_API_KEY non si invia nulla e si logga soltanto: il sito funziona lo stesso.
// Mittente: EMAIL_FROM (es. "Pullosophy <ordini@pullosophy.it>", dominio verificato su Resend);
// in mancanza si usa l'indirizzo di prova di Resend, che consegna solo all'email del proprietario dell'account.
import { Resend } from "resend";
import { company } from "@/lib/company";

const FROM = process.env.EMAIL_FROM ?? "Pullosophy <onboarding@resend.dev>";

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY mancante: non invio "${opts.subject}" a ${opts.to}`);
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    replyTo: company.email,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (error) throw new Error(`Resend: ${error.name} ${error.message}`);
  return { id: data?.id };
}
