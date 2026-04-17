"use client"
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthModal } from '@/components/auth/AuthModal';
import AppHeader from '@/components/ui/AppHeader';
import {
  Zap, Layout, Globe, Lock, ArrowRight, Check, Star,
  Paintbrush, MousePointer, BarChart3, ChevronDown
} from 'lucide-react';

const stats = [
  { value: '500+', label: 'Sites créés' },
  { value: '3min', label: 'Pour publier' },
  { value: '0', label: 'Ligne de code' },
  { value: '100%', label: 'Visuel' },
];

const features = [
  {
    icon: Paintbrush,
    title: 'Éditeur visuel',
    description: 'Glisse, modifie, publie. Chaque section se configure en un clic sans jamais toucher au code.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Zap,
    title: 'Publication instantanée',
    description: 'Tes changements sont en ligne en quelques secondes. Pas de build, pas d\'attente.',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Globe,
    title: 'Domaine personnalisé',
    description: 'Connecte ton propre domaine en deux clics. Ton site, ton adresse, ta marque.',
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Layout,
    title: 'Templates pro',
    description: 'Des sections pensées pour convertir : hero, témoignages, pricing, FAQ. Rien à inventer.',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Lock,
    title: 'Multi-utilisateurs',
    description: 'Invite ton équipe, définis les rôles. Chacun accède à ce dont il a besoin, rien de plus.',
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
  },
  {
    icon: BarChart3,
    title: 'Contrôle total',
    description: 'Teste, corrige et itère sans jamais casser ce qui marche. Le contenu reste toujours le tien.',
    color: 'from-sky-400 to-cyan-500',
    bg: 'bg-sky-50',
  },
];

const steps = [
  {
    num: '01',
    title: 'Crée ton espace',
    description: 'Un compte, un site, un slug. Tu es prêt en moins d\'une minute.',
  },
  {
    num: '02',
    title: 'Construis ta page',
    description: 'Ajoute des sections, personnalise le texte et les couleurs avec l\'éditeur visuel.',
  },
  {
    num: '03',
    title: 'Publie & itère',
    description: 'Un bouton suffit. Et tu peux revenir affiner à tout moment sans tout casser.',
  },
];

const testimonials = [
  {
    quote: 'On a enfin un site qui donne confiance dès la première seconde. Les prospects le sentent tout de suite.',
    author: 'Nina M.',
    role: 'Fondatrice · Studio de design',
    stars: 5,
    avatar: 'NM',
    color: 'from-violet-400 to-purple-500',
  },
  {
    quote: 'Chaque semaine on ajuste une section. En pratique, on reste agiles sans sacrifier le rendu.',
    author: 'Karim B.',
    role: 'Head of Marketing · SaaS B2B',
    stars: 5,
    avatar: 'KB',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    quote: 'J\'ai livré 3 sites clients en une semaine. Avec l\'ancien process, ça m\'aurait pris un mois.',
    author: 'Sarah L.',
    role: 'Freelance · Développeuse web',
    stars: 5,
    avatar: 'SL',
    color: 'from-emerald-400 to-teal-500',
  },
];

const faqs = [
  {
    question: 'Est-ce que je dois être technique pour utiliser PageBlanche ?',
    answer: 'Non. L\'interface est entièrement visuelle. Tu cliques, tu modifies, tu publies. Aucune ligne de code n\'est nécessaire.',
  },
  {
    question: 'Combien de temps pour avoir une landing page propre ?',
    answer: 'Tu peux sortir une version solide en quelques heures. Choisis une structure, remplace le contenu par le tien, publie.',
  },
  {
    question: 'Puis-je connecter mon propre nom de domaine ?',
    answer: 'Oui. Tu peux connecter un domaine personnalisé depuis les paramètres de ton site, en quelques clics.',
  },
  {
    question: 'Que se passe-t-il si je fais une erreur sur le site ?',
    answer: 'Tu peux retoucher, corriger et republier à tout moment. Rien n\'est irréversible, tu gardes toujours le contrôle.',
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-bold text-slate-900">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
          {answer}
        </p>
      )}
    </button>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const userName = session?.user?.name || 'Créateur';
  const openAuth = () => setIsAuthOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-900 [font-family:'Sora',_'Manrope',_sans-serif]">

      <AppHeader sticky translucent subtitle="CMS MODERNE & INTUITIF">
        <nav className="flex items-center gap-3 sm:gap-4">
          {session ? (
            <>
              <span className="hidden text-sm font-medium text-slate-500 md:inline">Bonjour, {userName}</span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                Déconnexion
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Mon espace →
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={openAuth}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Se connecter
              </button>
              <button
                onClick={openAuth}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Démarrer gratuitement
              </button>
            </>
          )}
        </nav>
      </AppHeader>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Nouveau · Éditeur visuel v2
            </div>

            {/* Heading */}
            <h1 className="[font-family:'DM_Serif_Display',_serif] max-w-4xl text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Ton site web,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                sans coder.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400 sm:text-xl">
              Crée, modifie et publie des pages qui convertissent — en quelques minutes, pas en quelques semaines.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              {session ? (
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1 hover:shadow-blue-900/50"
                >
                  Ouvrir mon espace
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <button
                  onClick={openAuth}
                  className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1 hover:shadow-blue-900/50"
                >
                  Créer mon site gratuitement
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              )}
              <button
                onClick={openAuth}
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Voir une démo
              </button>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Aucune carte bancaire · Publié en 3 minutes · Annulable à tout moment
            </p>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-[20px] border border-white/10 bg-slate-900/80 p-1 shadow-2xl shadow-black/50 backdrop-blur">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <div className="mx-auto flex items-center gap-2 rounded-lg bg-white/5 px-4 py-1 text-xs text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  monsite.pageblanche.app
                </div>
                <span className="text-xs text-blue-400 font-semibold">PUBLIÉ</span>
              </div>
              {/* Content */}
              <div className="grid grid-cols-5 gap-0 p-4 min-h-[260px]">
                {/* Sidebar */}
                <div className="col-span-1 space-y-1.5 border-r border-white/5 pr-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">Blocs</p>
                  {['Hero', 'Features', 'Pricing', 'FAQ', 'CTA'].map((b, i) => (
                    <div key={b} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${i === 0 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:bg-white/5'}`}>
                      <MousePointer size={10} />
                      {b}
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div className="col-span-4 pl-4 space-y-3">
                  <div className="rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/10 p-4">
                    <div className="h-2 w-16 rounded bg-blue-400/40 mb-2" />
                    <div className="h-4 w-48 rounded bg-white/30" />
                    <div className="h-3 w-36 rounded bg-white/15 mt-1.5" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-7 w-20 rounded-lg bg-blue-500/60" />
                      <div className="h-7 w-16 rounded-lg bg-white/10 border border-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['bg-violet-500/15', 'bg-emerald-500/15', 'bg-amber-500/15'].map((c, i) => (
                      <div key={i} className={`rounded-lg ${c} p-2.5 border border-white/5`}>
                        <div className="h-2 w-8 rounded bg-white/20 mb-1.5" />
                        <div className="h-1.5 w-12 rounded bg-white/10" />
                        <div className="h-1.5 w-10 rounded bg-white/10 mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-1.5 w-24 rounded bg-white/20" />
                      <div className="h-1.5 w-16 rounded bg-white/10" />
                    </div>
                    <div className="h-7 w-24 rounded-lg bg-gradient-to-r from-blue-500/60 to-indigo-500/60" />
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under mockup */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-3/4 rounded-full bg-blue-500/15 blur-3xl" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="[font-family:'DM_Serif_Display',_serif] text-4xl font-bold text-slate-900 md:text-5xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
            Fonctionnalités
          </span>
          <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900 md:text-5xl">
            Tout ce dont tu as besoin,
            <br />
            <span className="text-slate-400">rien de ce dont tu n'as pas besoin.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-slate-200"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-950 text-white py-24 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              En 3 étapes
            </span>
            <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight md:text-5xl">
              De zéro à publié
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">en quelques minutes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <span className="[font-family:'DM_Serif_Display',_serif] text-6xl font-bold text-white/5 absolute top-6 right-8 select-none">
                  {step.num}
                </span>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            {session ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1"
              >
                Commencer maintenant
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                onClick={openAuth}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1"
              >
                Commencer maintenant
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-emerald-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">
            Témoignages
          </span>
          <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900 md:text-5xl">
            Ils l'ont fait.
            <br />
            <span className="text-slate-400">Voilà ce qu'ils en disent.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.author}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-base leading-relaxed text-slate-700 flex-1">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.author}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-14">
            <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900 md:text-5xl">
              Avant vs après PageBlanche
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">Avant</p>
              <ul className="space-y-3">
                {[
                  'Un site qui ne te ressemble plus',
                  'Des modifs lentes et stressantes',
                  'Dépendance à un dev pour chaque update',
                  'Des pages qui convertissent mal',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-200 flex items-center justify-center text-red-500 font-black text-[10px]">✕</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4">Après PageBlanche</p>
              <ul className="space-y-3">
                {[
                  'Une vitrine claire, moderne et différenciante',
                  'Des updates en quelques minutes',
                  'Autonomie totale sur ton contenu',
                  'Un message net qui convertit',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-200 flex items-center justify-center">
                      <Check size={10} className="text-emerald-600 font-black" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-slate-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            FAQ
          </span>
          <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight text-slate-900">
            Tu as des questions ?
            <br />
            <span className="text-slate-400">Voilà les réponses.</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-10 text-white text-center md:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-violet-600/15 blur-[60px]" />
          </div>
          <div className="relative">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Prêt à te lancer ?
            </span>
            <h2 className="[font-family:'DM_Serif_Display',_serif] text-4xl leading-tight md:text-6xl mb-6">
              Ton site mérite
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                mieux qu'un template fade.
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">
              Crée un compte, construis ta première page, et publie — tout ça en moins de 10 minutes.
            </p>
            {session ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1"
              >
                Aller sur mon dashboard
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                onClick={openAuth}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-1"
              >
                Créer mon site gratuitement
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <p className="mt-4 text-xs text-slate-600">Gratuit · Sans carte bancaire · Annulable à tout moment</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="[font-family:'DM_Serif_Display',_serif] text-lg font-bold text-slate-900">PageBlanche</p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} PageBlanche · CMS moderne &amp; intuitif</p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-700 transition">Confidentialité</a>
            <a href="#" className="hover:text-slate-700 transition">CGU</a>
            <a href="#" className="hover:text-slate-700 transition">Contact</a>
          </div>
        </div>
      </footer>

      {isAuthOpen && (
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      )}
    </div>
  );
}
