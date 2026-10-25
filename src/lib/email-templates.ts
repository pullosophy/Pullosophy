// Testi delle email (IT/EN) e impaginazione minima compatibile con i client di posta.
import type { Order, OrderItem } from "@prisma/client";
import { company } from "@/lib/company";
import { formatPrice } from "@/lib/format";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pullosophy.vercel.app";

type Locale = "it" | "en";
const loc = (l: string): Locale => (l === "en" ? "en" : "it");

const texts = {
  it: {
    confirmSubject: (n: string) => `Ordine ${n} confermato · Pullosophy`,
    confirmTitle: "Grazie per il tuo ordine!",
    confirmIntro: "Abbiamo ricevuto il pagamento. Prepariamo tutto con cura e ti scriviamo appena spediamo.",
    shippedSubject: (n: string) => `Ordine ${n} spedito · Pullosophy`,
    shippedTitle: "Il tuo ordine è partito!",
    shippedIntro: "Il pacco è in viaggio. Le carte viaggiano protette in sleeve e toploader, i sigillati imbottiti.",
    tracking: "Codice di tracciamento",
    welcomeSubject: "Il tuo codice sconto Pullosophy",
    welcomeTitle: "Benvenuto su Pullosophy!",
    welcomeIntro: (p: number) => `Ecco il tuo codice per avere il ${p}% di sconto sul primo ordine. Inseriscilo nel campo "Codice promozionale" al momento del pagamento.`,
    welcomeNews: "Ti scriveremo quando escono nuove espansioni, preordini e gradate. Puoi cancellarti quando vuoi rispondendo a questa email.",
    order: "Ordine",
    items: "Articoli",
    subtotal: "Subtotale",
    shipping: "Spedizione",
    total: "Totale",
    shipTo: "Spedizione a",
    questions: "Domande? Rispondi a questa email.",
    shop: "Vai al negozio",
  },
  en: {
    confirmSubject: (n: string) => `Order ${n} confirmed · Pullosophy`,
    confirmTitle: "Thank you for your order!",
    confirmIntro: "We've received your payment. We'll pack everything with care and write to you as soon as it ships.",
    shippedSubject: (n: string) => `Order ${n} shipped · Pullosophy`,
    shippedTitle: "Your order is on its way!",
    shippedIntro: "Your parcel has left. Cards travel in sleeves and toploaders, sealed products are padded.",
    tracking: "Tracking number",
    welcomeSubject: "Your Pullosophy discount code",
    welcomeTitle: "Welcome to Pullosophy!",
    welcomeIntro: (p: number) => `Here is your code for ${p}% off your first order. Enter it in the "Promotion code" field at checkout.`,
    welcomeNews: "We'll write to you when new sets, pre-orders and graded cards drop. Unsubscribe any time by replying to this email.",
    order: "Order",
    items: "Items",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    shipTo: "Shipping to",
    questions: "Questions? Just reply to this email.",
    shop: "Go to the shop",
  },
};

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

// Numero ordine corto e leggibile (ultimi 8 caratteri dell'id, maiuscoli).
export function orderNumber(id: string) {
  return id.slice(-8).toUpperCase();
}

// Nel piede solo i dati reali: i segnaposto "[da completare]" restano fuori dalle email.
function footerLine() {
  return [company.brand, company.address, company.email].filter((v) => v && !v.startsWith("[")).join(" · ");
}

function layout(title: string, bodyHtml: string, t: (typeof texts)[Locale]) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#E3242B;padding:20px 24px;color:#fff;font-size:22px;font-weight:800;letter-spacing:.04em">PULLOSOPHY</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:22px">${esc(title)}</h1>
${bodyHtml}
<p style="margin:24px 0 0;font-size:14px;color:#555">${esc(t.questions)}</p>
<p style="margin:16px 0 0"><a href="${SITE}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">${esc(t.shop)}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#fafafa;font-size:12px;color:#777">${esc(footerLine())}</td></tr>
</table></td></tr></table></body></html>`;
}

type OrderWithItems = Order & { items: OrderItem[] };
type Address = { name?: string; address?: Record<string, string | null> };

function addressLine(order: Order) {
  const ship = order.shippingAddress as Address | null;
  const a = ship?.address;
  if (!a) return "";
  return [ship?.name, a.line1, a.line2, [a.postal_code, a.city, a.state].filter(Boolean).join(" "), a.country]
    .filter(Boolean)
    .join(", ");
}

function orderSummary(order: OrderWithItems, t: (typeof texts)[Locale]) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity} × ${esc(i.titleSnapshot)}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #eee;white-space:nowrap">${formatPrice(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  const addr = addressLine(order);
  const html = `
<p style="margin:0 0 16px;font-size:14px;color:#555">${esc(t.order)} <strong>${orderNumber(order.id)}</strong></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
${rows}
<tr><td style="padding:8px 0 0;color:#555">${esc(t.subtotal)}</td><td align="right" style="padding:8px 0 0">${formatPrice(order.subtotalCents)}</td></tr>
<tr><td style="color:#555">${esc(t.shipping)}</td><td align="right">${formatPrice(order.shippingCents)}</td></tr>
<tr><td style="padding:8px 0 0;font-weight:700">${esc(t.total)}</td><td align="right" style="padding:8px 0 0;font-weight:700">${formatPrice(order.totalCents)}</td></tr>
</table>
${addr ? `<p style="margin:16px 0 0;font-size:14px"><strong>${esc(t.shipTo)}:</strong><br>${esc(addr)}</p>` : ""}`;
  const text = [
    `${t.order} ${orderNumber(order.id)}`,
    ...order.items.map((i) => `${i.quantity} × ${i.titleSnapshot}: ${formatPrice(i.unitPriceCents * i.quantity)}`),
    `${t.subtotal}: ${formatPrice(order.subtotalCents)}`,
    `${t.shipping}: ${formatPrice(order.shippingCents)}`,
    `${t.total}: ${formatPrice(order.totalCents)}`,
    addr ? `${t.shipTo}: ${addr}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { html, text };
}

export function orderConfirmationEmail(order: OrderWithItems) {
  const t = texts[loc(order.locale)];
  const s = orderSummary(order, t);
  return {
    subject: t.confirmSubject(orderNumber(order.id)),
    html: layout(t.confirmTitle, `<p style="margin:0 0 16px;font-size:15px">${esc(t.confirmIntro)}</p>${s.html}`, t),
    text: `${t.confirmTitle}\n\n${t.confirmIntro}\n\n${s.text}\n\n${t.questions}\n${SITE}`,
  };
}

export function orderShippedEmail(order: OrderWithItems) {
  const t = texts[loc(order.locale)];
  const s = orderSummary(order, t);
  const tracking = order.trackingNumber
    ? `<p style="margin:0 0 16px;font-size:15px"><strong>${esc(t.tracking)}:</strong> ${esc(order.trackingNumber)}</p>`
    : "";
  return {
    subject: t.shippedSubject(orderNumber(order.id)),
    html: layout(t.shippedTitle, `<p style="margin:0 0 16px;font-size:15px">${esc(t.shippedIntro)}</p>${tracking}${s.html}`, t),
    text: `${t.shippedTitle}\n\n${t.shippedIntro}\n${order.trackingNumber ? `${t.tracking}: ${order.trackingNumber}\n` : ""}\n${s.text}\n\n${t.questions}\n${SITE}`,
  };
}

export function welcomeEmail(locale: string, code: string, percent: number, newReleases: boolean) {
  const t = texts[loc(locale)];
  const news = newReleases ? `<p style="margin:16px 0 0;font-size:14px;color:#555">${esc(t.welcomeNews)}</p>` : "";
  return {
    subject: t.welcomeSubject,
    html: layout(
      t.welcomeTitle,
      `<p style="margin:0 0 16px;font-size:15px">${esc(t.welcomeIntro(percent))}</p>
<p style="margin:0;text-align:center;border:2px dashed #E3242B;border-radius:12px;padding:14px;font-size:28px;font-weight:800;letter-spacing:.15em;color:#E3242B">${esc(code)}</p>${news}`,
      t,
    ),
    text: `${t.welcomeTitle}\n\n${t.welcomeIntro(percent)}\n\n${code}\n${newReleases ? `\n${t.welcomeNews}\n` : ""}\n${SITE}`,
  };
}
