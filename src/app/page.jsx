"use client"
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthModal } from '@/components/auth/AuthModal';
import AppHeader from '@/components/ui/AppHeader';

const promises = [
  {
    title: 'Un site qui te ressemble vraiment',
    description:
      'Tu pars d une page blanche et tu construis un univers coherent en quelques glissements.',
  },
  {
    title: 'Zero friction pour publier',
    description:
      'Tu ajustes ton message, tu valides, ton site est en ligne. Pas de tunnel interminable.',
  },
  {
    title: 'Un rendu pro sans designer interne',
    description:
      'Mise en page nette, rythme visuel clair, sections impactantes. Ton image monte d un cran.',
  },
  {
    title: 'Tout ton contenu sous controle',
    description:
      'Tu peux tester, corriger et publier au bon moment, sans casser ce qui marche deja.',
  },
];

const transformations = [
  {
    title: 'Avant',
    points: [
      'Un site qui ne te ressemble plus',
      'Des modifs lentes et stressantes',
      'Des pages qui convertissent mal',
    ],
  },
  {
    title: 'Apres PageBlanche',
    points: [
      'Une vitrine claire, moderne et differenciante',
      'Des updates en quelques minutes',
      'Un message net qui donne envie de te contacter',
    ],
  },
];

const useCases = [
  {
    title: 'Freelance',
    text: 'Montre ton expertise et transforme les visites en demandes qualifiees.',
  },
  {
    title: 'Agence',
    text: 'Livre des sites plus vite et garde une qualite constante sur chaque projet.',
  },
  {
    title: 'Startup',
    text: 'Teste des offres, ajuste ton positionnement et evolue sans refaire tout le site.',
  },
];

const testimonials = [
  {
    quote:
      'On a enfin un site qui donne confiance des la premiere seconde. Les prospects le sentent tout de suite.',
    author: 'Nina, fondatrice studio',
  },
  {
    quote:
      'Chaque semaine on ajuste une section. En pratique, on reste agile sans sacrifier le rendu.',
    author: 'Karim, equipe marketing',
  },
];

const faqs = [
  {
    question: 'Est-ce que je dois etre technique ?',
    answer:
      'Non. Tu peux creer et publier en mode visuel. L interface est faite pour aller vite sans complexite inutile.',
  },
  {
    question: 'Combien de temps pour avoir une belle landing ?',
    answer:
      'Tu peux sortir une version propre en quelques heures, puis l ameliorer au fil des retours.',
  },
  {
    question: 'Je peux iterer souvent sans tout casser ?',
    answer:
      'Oui. Tu peux retoucher, tester et publier progressivement pour garder le controle en continu.',
  },
];

export default function Home() {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const userName = session?.user?.name || 'Createur';

  const openAuth = () => setIsAuthOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-pb-background text-pb-foreground [font-family:'Sora',_'Manrope',_sans-serif]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-20 right-8 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-10 left-8 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <AppHeader sticky translucent subtitle="Creer. Seduire. Convertir.">
        <nav className="flex items-center gap-3 sm:gap-6">
          {session ? (
            <>
              <span className="hidden text-sm font-medium md:inline">Bonjour, {userName}</span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                Deconnexion
              </button>
              <Link 
                href="/dashboard"
                className="rounded-xl bg-pb-foreground px-4 py-2 text-sm font-semibold text-pb-background transition hover:-translate-y-0.5"
              >
                Ouvrir mon espace
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={openAuth}
                className="text-sm font-medium transition-colors hover:text-pb-accent"
              >
                Se connecter
              </button>
              <button 
                onClick={openAuth}
                className="rounded-xl bg-pb-foreground px-4 py-2 text-sm font-semibold text-pb-background transition hover:-translate-y-0.5"
              >
                Creer mon site
              </button>
            </>
          )}
        </nav>
      </AppHeader>

      <main>
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-pb-border bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-black">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Ton image merite mieux qu un template fade
            </div>

            <h1 className="[font-family:'DM_Serif_Display',_serif] text-5xl leading-[1.03] tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Cree un site
              <span className="block text-blue-600">qui fait dire</span>
              <span className="block text-blue-600">"c est exactement ce qu il me faut".</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-700 sm:text-xl">
              Ta landing doit donner envie en 5 secondes. Tu veux captiver, rassurer, puis convertir.
              PageBlanche t aide a raconter ton offre avec un vrai impact visuel.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-blue-600 px-7 py-4 text-center text-base font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Lancer ma prochaine landing
                </Link>
              ) : (
                <button
                  onClick={openAuth}
                  className="rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Je veux un site qui convertit
                </button>
              )}
              <Link
                href="/dashboard"
                className="rounded-2xl border border-pb-border bg-white/80 px-7 py-4 text-center text-base font-semibold text-slate-800 transition hover:bg-white"
              >
                Voir des exemples
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-700">
              <span className="font-semibold">Message plus clair</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>Image plus premium</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>Plus de demandes client</span>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-800/10">
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-slate-200">
                <p className="text-xs tracking-[0.16em]">PAGE PREVIEW</p>
                <p className="text-xs text-blue-300">READY TO PUBLISH</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Hero</p>
                  <p className="mt-2 text-base font-bold text-slate-900">Transforme tes visiteurs en clients</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">Offre claire</div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Preuve sociale</div>
                </div>
                <div className="rounded-xl bg-sky-50 p-3 text-sm font-semibold text-sky-900">
                  CTA principal: "Prendre rendez-vous"
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-pb-border bg-white/75 p-5 md:grid-cols-2">
            {transformations.map((block) => (
              <div key={block.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{block.title}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {block.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Ce que tu gagnes</p>
            <h2 className="mt-2 [font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900">
              Un site qui bosse pour toi pendant que tu bosses pour tes clients.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {promises.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-pb-border bg-white/85 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="rounded-[2rem] border border-pb-border bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1e293b] p-8 text-slate-100 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pour qui</p>
            <h2 className="mt-2 [font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-white">
              Freelance, agence ou startup: meme objectif, faire forte impression.
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/20 bg-white/5 p-5">
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Ils en parlent comme ca</p>
            <h2 className="mt-2 [font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900">
              Ce qui compte: la reaction des visiteurs et la confiance creee.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {testimonials.map((item) => (
              <article key={item.author} className="rounded-3xl border border-pb-border bg-white/80 p-7">
                <p className="text-lg leading-relaxed text-slate-800">"{item.quote}"</p>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{item.author}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">FAQ</p>
            <h2 className="mt-2 [font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900">
              Tu veux etre rassure avant de te lancer ?
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-pb-border bg-white/75 p-5 open:bg-white">
                <summary className="cursor-pointer list-none text-lg font-extrabold text-slate-900">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="rounded-[2rem] border border-pb-border bg-gradient-to-br from-blue-50 via-white to-sky-50 p-8 text-slate-900 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Derniere ligne droite</p>
            <h2 className="mt-2 [font-family:'DM_Serif_Display',_serif] text-4xl leading-tight md:text-5xl">
              Si ton site doit donner envie, commence maintenant.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-700">
              Tu n as pas besoin d un site "correct". Tu as besoin d un site memorisable qui fait passer tes prospects a l action.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-blue-600 px-7 py-4 text-center text-base font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Continuer mon site
                </Link>
              ) : (
                <button
                  onClick={openAuth}
                  className="rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Je veux cette landing
                </button>
              )}
              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-300 bg-white/80 px-7 py-4 text-center text-base font-semibold text-slate-800 transition hover:bg-white"
              >
                Voir mon espace
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL / POPUP DE CONNEXION */}
      {isAuthOpen && (
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      )}
    </div>
  );
}

