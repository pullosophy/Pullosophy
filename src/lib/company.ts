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
