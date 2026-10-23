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
(da Supabase → Connect → ORM/Prisma), `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.

Vercel usa lo script `vercel-build`, che applica le migrazioni, inserisce giochi e zone di spedizione
(operazione ripetibile senza duplicati) e poi compila il sito.

Webhook Stripe: in Stripe → Developers → Webhooks aggiungi `https://<dominio>/api/stripe/webhook`
con gli eventi `checkout.session.completed` e `checkout.session.expired`, poi copia il signing secret
in `STRIPE_WEBHOOK_SECRET`.

## Pannello admin

`/admin`, protetto dalla password `ADMIN_PASSWORD`. Da lì:

- **Espansioni**: aggiorna l'elenco delle espansioni Pokémon e importa le carte di quelle che vendi
- **Prodotti**: crea e modifica carte singole, sigillati e gradate (prezzo, quantità, foto, online/bozza)
- **Ordini**: vedi gli ordini con indirizzo, cambia lo stato e aggiungi il codice di tracking
