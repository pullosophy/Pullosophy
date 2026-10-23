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
