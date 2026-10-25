// Dati del venditore mostrati nelle pagine legali e nel footer.
// Quelli con "[da completare]" vanno sostituiti con i dati fiscali reali
// prima di andare in produzione con pagamenti veri.
export const company = {
  brand: "Pullosophy",
  legalName: process.env.COMPANY_LEGAL_NAME ?? "[da completare: ragione sociale o nome e cognome]",
  vat: process.env.COMPANY_VAT ?? "[da completare: Partita IVA]",
  address: process.env.COMPANY_ADDRESS ?? "[da completare: via e numero civico], Mantova (MN), Italia",
  email: process.env.COMPANY_EMAIL ?? "info@pullosophy.it",
  city: "Mantova",
};

// Profili social mostrati nel footer.
export const socials = [
  { name: "Instagram", handle: "@pullosophy_tgc", url: "https://www.instagram.com/pullosophy_tgc/" },
  { name: "TikTok", handle: "@pullosophy", url: "https://www.tiktok.com/@pullosophy" },
];

// Finché Stripe e' in modalita' test (chiave sk_test_) il sito mostra la striscia "negozio in apertura".
export const previewMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
