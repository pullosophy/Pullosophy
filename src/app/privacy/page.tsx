import { LegalPage } from "@/components/legal-page";
import { company } from "@/lib/company";

export const metadata = { title: "Privacy", description: "Informativa sul trattamento dei dati personali di Pullosophy ai sensi del GDPR." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="24 ottobre 2026">
      <h2>Titolare del trattamento</h2>
      <p>
        {company.legalName}, {company.address}, email <a href={`mailto:${company.email}`}>{company.email}</a>.
      </p>

      <h2>Quali dati raccogliamo e perché</h2>
      <ul>
        <li>
          <strong>Dati dell&apos;ordine</strong> (nome, indirizzo di spedizione, email, articoli acquistati): servono per eseguire il
          contratto, spedire l&apos;ordine e adempiere agli obblighi fiscali. Conservati per 10 anni come richiesto dalla normativa
          contabile.
        </li>
        <li>
          <strong>Dati di pagamento</strong>: sono trattati direttamente da Stripe Payments Europe Ltd. Pullosophy non riceve né conserva i
          dati della carta.
        </li>
        <li>
          <strong>Newsletter</strong> (email lasciata nel pop-up di benvenuto): usata solo per inviarti il codice sconto e le novità del
          negozio, in base al tuo consenso. Puoi cancellarti in qualsiasi momento scrivendoci; i dati vengono eliminati subito.
        </li>
        <li>
          <strong>Carrello</strong>: il contenuto del carrello è salvato in un cookie tecnico sul tuo dispositivo, non su nostri server.
        </li>
        <li>
          <strong>Log tecnici</strong> (indirizzo IP, browser): generati dall&apos;hosting Vercel per sicurezza e funzionamento del sito,
          conservati per breve periodo.
        </li>
      </ul>

      <h2>Con chi condividiamo i dati</h2>
      <p>
        Solo con i fornitori necessari al servizio: Stripe (pagamenti), Vercel (hosting), Supabase (database, server in Unione Europea) e
        il corriere incaricato della consegna. Non vendiamo i dati a terzi e non facciamo profilazione pubblicitaria.
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere in qualsiasi momento accesso, rettifica, cancellazione, limitazione o portabilità dei tuoi dati scrivendo a{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei
        dati personali.
      </p>
    </LegalPage>
  );
}
