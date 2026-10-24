import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { company } from "@/lib/company";

export const metadata = { title: "Termini e condizioni di vendita", description: "Condizioni generali di vendita di Pullosophy: ordini, prezzi, pagamenti, spedizioni, recesso e garanzia." };

export default function TermsPage() {
  return (
    <LegalPage title="Termini di vendita" updated="24 ottobre 2026">
      <h2>1. Chi siamo</h2>
      <p>
        Il sito è gestito da <strong>{company.legalName}</strong>, P. IVA {company.vat}, con sede in {company.address} (di seguito
        &quot;Pullosophy&quot;). Contatti: <a href={`mailto:${company.email}`}>{company.email}</a>.
      </p>

      <h2>2. Prodotti</h2>
      <p>
        Vendiamo carte collezionabili singole, prodotti sigillati e carte gradate da enti terzi (PSA, BGS, CGC). Le condizioni delle carte
        singole seguono la scala descritta nella pagina <Link href="/condizioni-carte">Condizioni delle carte</Link>. Per le carte gradate
        fa fede il voto dell&apos;ente di grading indicato nella scheda, verificabile con il numero di certificato. Le immagini delle carte
        singole possono essere immagini di catalogo; dove indicato &quot;foto reale&quot; mostrano l&apos;esemplare in vendita.
      </p>

      <h2>3. Prezzi e pagamenti</h2>
      <p>
        I prezzi sono in euro e comprensivi di IVA ove applicabile. Le spese di spedizione sono indicate nella pagina{" "}
        <Link href="/spedizioni">Spedizioni e resi</Link> e riepilogate prima del pagamento. Il pagamento avviene tramite Stripe (carte di
        credito e debito, Apple Pay, Google Pay); Pullosophy non memorizza i dati della carta.
      </p>

      <h2>4. Conclusione dell&apos;ordine</h2>
      <p>
        L&apos;ordine si considera concluso al momento della conferma del pagamento. Riceverai una conferma via email. In caso di errore di
        prezzo evidente o di prodotto non più disponibile ti contatteremo per proporre un&apos;alternativa o il rimborso integrale.
      </p>

      <h2>5. Spedizione</h2>
      <p>
        Spediamo in Italia e nei Paesi dell&apos;Unione Europea, con tracciamento, entro 2 giorni lavorativi dal pagamento. Il rischio di
        perdita o danneggiamento passa a te alla consegna. In caso di pacco danneggiato, fotografa l&apos;imballo prima di aprirlo e scrivici
        entro 48 ore.
      </p>

      <h2>6. Diritto di recesso</h2>
      <p>
        Ai sensi del Codice del Consumo (D.Lgs. 206/2005) hai diritto di recedere entro <strong>14 giorni</strong> dalla consegna senza
        indicare il motivo, comunicandolo a <a href={`mailto:${company.email}`}>{company.email}</a>. Il prodotto va restituito entro 14
        giorni dalla comunicazione, integro e con la stessa protezione in cui lo hai ricevuto; i prodotti sigillati devono essere ancora
        sigillati. Le spese di restituzione sono a tuo carico. Rimborsiamo l&apos;importo pagato, spedizione iniziale inclusa, entro 14
        giorni dal ricevimento del reso, con lo stesso mezzo di pagamento.
      </p>

      <h2>7. Garanzia e reclami</h2>
      <p>
        Garantiamo che ogni carta è autentica e corrisponde alla condizione dichiarata. Se ricevi un prodotto diverso da quanto descritto,
        hai diritto alla sostituzione o al rimborso, con spese di reso a nostro carico. Si applica la garanzia legale di conformità prevista
        dal Codice del Consumo.
      </p>

      <h2>8. Legge applicabile</h2>
      <p>
        Queste condizioni sono regolate dalla legge italiana. Per le controversie con i consumatori è competente il foro del luogo di
        residenza del consumatore. Puoi anche rivolgerti alla piattaforma europea per la risoluzione delle controversie online (ODR).
      </p>
    </LegalPage>
  );
}
