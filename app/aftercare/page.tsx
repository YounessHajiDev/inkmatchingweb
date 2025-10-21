'use client'

export default function AftercarePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <div className="absolute inset-0 bg-ink-panel opacity-60" aria-hidden />
        <div className="relative z-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Aftercare</p>
          <h1 className="text-3xl font-semibold text-white">Heal beautifully</h1>
          <p className="max-w-xl text-sm text-ink-text-muted">Share aftercare plans inside InkMatching so clients follow the exact routine you recommend. Schedule reminders and keep everything trackable.</p>
          <button className="btn btn-primary">Create template</button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft">
        <h2 className="text-xl font-semibold text-white">Standard aftercare</h2>
        <ol className="ml-6 list-decimal space-y-2 text-sm text-ink-text-muted">
          <li>Garde le pansement 2–4h, puis lave doucement à l’eau tiède + savon doux.</li>
          <li>Sèche en tamponnant avec une serviette propre.</li>
          <li>Applique une fine couche de baume 2–3×/jour pendant 5–7 jours.</li>
          <li>Évite piscine, sauna, soleil direct et grattage pendant 2 semaines.</li>
          <li>Après cicatrisation, protège au SPF 50.</li>
        </ol>
      </section>

      <section className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft">
        <h2 className="text-xl font-semibold text-white">Quand contacter l’artiste ?</h2>
        <p className="text-sm text-ink-text-muted">
          Rougeur excessive, chaleur, suintement inhabituel, fièvre — envoie un message dans le chat pour un avis. Tout reste documenté.
        </p>
      </section>

      <section className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft">
        <h2 className="text-xl font-semibold text-white">Produits recommandés</h2>
        <ul className="ml-6 list-disc space-y-1 text-sm text-ink-text-muted">
          <li>Nettoyant doux pH neutre</li>
          <li>Baume cicatrisant non parfumé</li>
          <li>Crème solaire SPF 50</li>
        </ul>
      </section>
    </div>
  )
}
