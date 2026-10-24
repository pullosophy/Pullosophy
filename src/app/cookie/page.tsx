import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Cookie", description: "Quali cookie usa Pullosophy: solo cookie tecnici, nessun tracciamento pubblicitario." };

export default function CookiePage() {
  return (
    <LegalPage title="Cookie" updated="24 ottobre 2026">
      <p>
        Pullosophy usa <strong>solo cookie tecnici</strong>, necessari al funzionamento del sito. Per questo motivo non serve un banner di
        consenso: i cookie tecnici non richiedono autorizzazione secondo le linee guida del Garante Privacy.
      </p>
      <h2>Cookie utilizzati</h2>
      <ul>
        <li>
          <code>cart</code>: ricorda gli articoli nel tuo carrello tra una pagina e l&apos;altra. Dura 30 giorni.
        </li>
        <li>
          <code>admin</code>: usato solo dal gestore del negozio per accedere al pannello di amministrazione.
        </li>
        <li>Cookie di Stripe nella pagina di pagamento, necessari a prevenire le frodi.</li>
      </ul>
      <p>Non usiamo cookie di profilazione, pubblicitari o di analisi di terze parti. Puoi cancellare i cookie dalle impostazioni del browser in qualsiasi momento.</p>
    </LegalPage>
  );
}
