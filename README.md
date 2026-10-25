# Pullosophy

Negozio online di carte collezionabili: Pokémon per iniziare, poi One Piece e altri giochi.

Stack: Next.js (App Router), Postgres (Supabase) con Prisma, Stripe per i pagamenti, hosting su Vercel.

## Catalogo

`Game` → `CardSet` → `Card` → `Listing`. Il `Listing` è ciò che si compra:

- `SINGLE`: carta singola, con lingua e condizione
- `SEALED`: prodotto sigillato (booster box, buste, ETB...), legato a un set ma non a una carta
- `GRADED`: carta gradata, con ente (PSA/BGS/CGC), voto, numero di certificato e foto reali

Aggiungere un nuovo gioco significa aggiungere una riga in `Game` e uno script di import, senza cambiare lo schema.

## Avvio in locale

```bash
cp .env.example .env        # inserisci DATABASE_URL e DIRECT_URL
npm install
npm run db:migrate          # crea le tabelle
npm run db:seed             # giochi e zone di spedizione
npm run import:pokemon -- sv3pt5   # espansioni Pokémon + carte del set indicato
npm run dev
```

## Pubblicazione su Vercel

Variabili da impostare in Vercel (Settings → Environment Variables): `DATABASE_URL`, `DIRECT_URL`
(da Supabase → Connect → ORM/Prisma), `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`; per le pagine legali `COMPANY_LEGAL_NAME`, `COMPANY_VAT`, `COMPANY_ADDRESS`, `COMPANY_EMAIL`.

Vercel usa lo script `vercel-build`, che applica le migrazioni, inserisce giochi e zone di spedizione
(operazione ripetibile senza duplicati) e poi compila il sito.

Webhook Stripe: in Stripe → Developers → Webhooks aggiungi `https://<dominio>/api/stripe/webhook`
con gli eventi `checkout.session.completed` e `checkout.session.expired`, poi copia il signing secret
in `STRIPE_WEBHOOK_SECRET`.

## Email

Le email (conferma ordine al pagamento, avviso di spedizione dall'admin, codice sconto all'iscrizione)
partono tramite [Resend](https://resend.com): crea un account, genera una API key e mettila in `RESEND_API_KEY`.
Per scrivere ai clienti serve un dominio verificato su Resend (Domains → Add domain, poi i record DNS):
a quel punto imposta `EMAIL_FROM="Pullosophy <ordini@tuodominio.it>"`. Senza dominio, Resend consegna
solo all'email del proprietario dell'account (utile per provare).

## Pannello admin

`/admin`, protetto dalla password `ADMIN_PASSWORD`. Per caricare foto dal pannello serve Vercel Blob: Vercel → Storage → Create → Blob, collegato al progetto (aggiunge `BLOB_READ_WRITE_TOKEN` da solo). Da lì:

- **Espansioni**: aggiorna l'elenco delle espansioni Pokémon e importa le carte di quelle che vendi
- **Prodotti**: crea e modifica carte singole, sigillati e gradate (prezzo, quantità, foto, online/bozza)
- **Ordini**: vedi gli ordini con indirizzo, cambia lo stato e aggiungi il codice di tracking
