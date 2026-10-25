// Dati del venditore mostrati nelle pagine legali e nel footer.
// Quelli con "[da completare]" vanno sostituiti con i dati fiscali reali
// prima di andare in produzione con pagamenti veri.
export const company = {
  brand: "Pullosophy",
  legalName: process.env.COMPANY_LEGAL_NAME ?? "[da completare: ragione sociale o nome e cognome]",
  vat: process.env.COMPANY_VAT ?? "[da completare: Partita IVA]",
  address: process.env.COMPANY_ADDRESS ?? "[da completare: via e numero civico], Mantova (MN), Italia",
  email: process.env.COMPANY_EMAIL ?? "info@pullosophy.it",
  // Numero WhatsApp in formato internazionale senza + ne' spazi (es. 393331234567). Vuoto = nessun pulsante.
  whatsapp: process.env.COMPANY_WHATSAPP?.replace(/[^0-9]/g, "") ?? "",
  city: "Mantova",
};

// I dati fiscali compaiono nel footer solo quando sono reali: i segnaposto restano nelle pagine legali.
export const companyDataReady = !company.legalName.includes("[da completare") && !company.vat.includes("[da completare");
export const whatsappUrl = (text?: string) =>
  company.whatsapp ? `https://wa.me/${company.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null;

// Profili social mostrati nel footer.
export const socials = [
  { name: "Instagram", handle: "@pullosophy_tgc", url: "https://www.instagram.com/pullosophy_tgc/" },
  { name: "TikTok", handle: "@pullosophy", url: "https://www.tiktok.com/@pullosophy" },
];

// Finché Stripe e' in modalita' test (chiave sk_test_) il sito mostra la striscia "negozio in apertura".
export const previewMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
