import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Settings, Users, LayoutDashboard, Globe, ExternalLink, Plus, FileText, ChevronRight } from 'lucide-react';
import { createNewPage, editSiteGlobalComponent } from '@/app/actions/site';
import PageList from '@/components/dashboard/PageList';
import ThemeToggle from '@/components/ui/ThemeToggle';

const GLOBAL_HEADER_SLUG = '__global-header';
const GLOBAL_FOOTER_SLUG = '__global-footer';

function getSiteErrorMessage(code) {
  switch (code) {
    case 'unauthorized':
      return 'Votre session a expiré, reconnectez-vous.';
    case 'site_access_denied':
      return 'Accès refusé à ce site.';
    case 'read_only':
      return 'Vous etes en lecture seule sur ce site.';
    case 'page_title_required':
      return 'Le titre de la page est obligatoire.';
    case 'page_slug_invalid':
      return 'Le titre ne permet pas de generer un slug valide.';
    case 'page_slug_required':
      return 'Le slug est obligatoire.';
    case 'page_not_found':
      return 'Page introuvable.';
    case 'invalid_status':
      return 'Statut de page invalide.';
    default:
      return code ? 'Une erreur est survenue. Veuillez reessayer.' : '';
  }
}

function getSiteSuccessMessage(code) {
  switch (code) {
    case 'page_created':
      return 'Page créée avec succès.';
    case 'page_updated':
      return 'Page mise à jour.';
    case 'page_status_updated':
      return 'Statut de la page mis à jour.';
    case 'page_deleted':
      return 'Page supprimée.';
    case 'global_component_added':
      return 'Composant global ajouté.';
    default:
      return '';
  }
}

export default async function SiteDashboardLayout({ params, searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/');

  const resolvedSearchParams = await searchParams;

  const resolvedParams = await params;
  const siteSlug = resolvedParams.siteSlug;

  // 1. Vérifier si le site existe et si le membre y a accès
  const membership = await prisma.member.findFirst({
    where: { 
      userId: session.user.id,
      site: { slug: siteSlug }
    },
    include: {
      site: {
        include: {
          // P3 — Exclure le champ content (JSON potentiellement volumineux) du listing
          pages: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              siteId: true,
              parentId: true,
              createdAt: true,
              updatedAt: true,
              modifications: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  createdAt: true,
                  action: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        }
      }
    }
  });

  if (!membership) {
    return redirect('/dashboard'); // Ou renvoyer sur une page 403
  }

  const site = membership.site;
  const canEdit = membership.role !== 'READER';
  const siteErrorMessage = getSiteErrorMessage(String(resolvedSearchParams?.siteError || ''));
  const siteSuccessMessage = getSiteSuccessMessage(String(resolvedSearchParams?.siteSuccess || ''));

  // Backfill pour les anciens sites: garantit l'existence des pages globales.
  await prisma.page.upsert({
    where: {
      siteId_slug: {
        siteId: site.id,
        slug: GLOBAL_HEADER_SLUG,
      },
    },
    update: {},
    create: {
      title: 'Header Global',
      slug: GLOBAL_HEADER_SLUG,
      status: 'DRAFT',
      content: [],
      siteId: site.id,
    },
  });

  await prisma.page.upsert({
    where: {
      siteId_slug: {
        siteId: site.id,
        slug: GLOBAL_FOOTER_SLUG,
      },
    },
    update: {},
    create: {
      title: 'Footer Global',
      slug: GLOBAL_FOOTER_SLUG,
      status: 'DRAFT',
      content: [],
      siteId: site.id,
    },
  });

  return (
    <div className="min-h-screen bg-pb-background text-pb-foreground flex flex-row font-sans">
      {/* Sidebar Gauche */}
      <aside className="w-64 border-r border-pb-border bg-pb-background/70 backdrop-blur-sm flex flex-col h-screen sticky top-0 px-4 py-8">
        <div className="flex items-center gap-3 mb-10 px-2 py-1 cursor-pointer group">
          <div className="w-10 h-10 bg-pb-accent rounded-lg flex items-center justify-center text-white font-bold text-xl uppercase shadow-lg group-hover:scale-105 transition-transform">
            {site.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold leading-tight group-hover:text-pb-accent transition-colors truncate max-w-[150px]">{site.name}</h1>
            <span className="text-xs text-pb-foreground/60">{site.isPublic ? 'En ligne' : 'Privé'}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href={`/dashboard/${site.slug}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-pb-accent/10 text-pb-accent font-medium group transition-all">
             <div className="flex items-center gap-3"><LayoutDashboard size={18} /> Pages</div>
             <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href={`/dashboard/${site.slug}/settings`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-pb-border/40 text-pb-foreground/70 hover:text-pb-foreground font-medium group transition-all">
             <div className="flex items-center gap-3"><Settings size={18} /> Paramètres Site</div>
             <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href={`/dashboard/${site.slug}/team`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-pb-border/40 text-pb-foreground/70 hover:text-pb-foreground font-medium group transition-all">
             <div className="flex items-center gap-3"><Users size={18} /> Équipe (Membres)</div>
             <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </nav>
        
          <div className="mt-auto px-2 space-y-3">
            <ThemeToggle compact />
            <Link href={`/dashboard`} className="text-xs text-pb-foreground/60 hover:underline block text-center">← Retour aux sites</Link>
           <a
             href={site.domain && site.isPublic ? `https://${site.domain}` : `/view/${site.slug}/home`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full py-3 bg-pb-foreground text-pb-background rounded-lg text-sm font-semibold hover:opacity-90 shadow-md"
           >
             <ExternalLink size={16} /> Visiter le site
           </a>
        </div>
      </aside>

      {/* Contenu Central */}
      <main className="flex-1 w-full min-w-0 overflow-y-auto p-8 md:p-12">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-pb-border">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-xs font-semibold text-pb-foreground/60 hover:text-pb-accent mb-3">← Tous les sites</Link>
            <h2 className="text-3xl font-extrabold tracking-tight mb-1">Architecture du Site</h2>
            <p className="text-pb-foreground/60 w-full">{canEdit ? 'Gérez vos pages, ajustez les brouillons et éditez le contenu visuel.' : 'Mode lecteur: aperçu et navigation uniquement.'}</p>
          </div>
          
          {canEdit ? (
            <form action={createNewPage} className="flex items-center gap-2">
               <input type="hidden" name="siteId" value={site.id} />
               <input type="hidden" name="siteSlug" value={site.slug} />
               <input name="title" required placeholder="Nouvelle page..." className="px-3 py-2 bg-pb-border/20 text-sm border border-pb-border rounded-md focus:border-pb-accent outline-none text-black" />
               <button className="bg-pb-accent text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:shadow-lg transition-transform hover:-translate-y-0.5 text-sm">
                  <Plus size={16} /> Ajouter
               </button>
            </form>
          ) : (
            <span className="text-xs font-semibold px-3 py-2 rounded-md border border-pb-border text-pb-foreground/60">Lecture seule</span>
          )}
        </header>

        {siteErrorMessage && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
            {siteErrorMessage}
          </div>
        )}

        {siteSuccessMessage && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            {siteSuccessMessage}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-pb-border bg-pb-background/40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold">Composants Globaux (Toutes les pages)</h3>
              <p className="text-xs text-pb-foreground/60">Éditez le Header/Footer partagé. Le template par défaut est injecté automatiquement si le composant est vide.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {canEdit ? (
                <>
                  <form action={editSiteGlobalComponent}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <input type="hidden" name="siteSlug" value={site.slug} />
                    <input type="hidden" name="componentType" value="header" />
                    <button className="px-3 py-2 rounded-lg border border-pb-border hover:bg-pb-border/20 text-xs font-semibold">
                      Éditer Header
                    </button>
                  </form>
                  <form action={editSiteGlobalComponent}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <input type="hidden" name="siteSlug" value={site.slug} />
                    <input type="hidden" name="componentType" value="footer" />
                    <button className="px-3 py-2 rounded-lg border border-pb-border hover:bg-pb-border/20 text-xs font-semibold">
                      Éditer Footer
                    </button>
                  </form>
                </>
              ) : (
                <span className="text-xs text-pb-foreground/60">Modification des globaux reservee aux editeurs/proprietaires.</span>
              )}
            </div>
          </div>
        </section>

        <section className="bg-pb-background border border-pb-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
          <div className="grid grid-cols-12 px-6 py-4 bg-pb-border/20 border-b border-pb-border text-xs font-semibold text-pb-foreground/60 uppercase tracking-wider">
             <div className="col-span-4">Nom de la page</div>
             <div className="col-span-2 text-center">Statut</div>
             <div className="col-span-2 text-center">Derniere modification</div>
             <div className="col-span-4 text-right">Actions</div>
          </div>

          <PageList initialPages={site.pages} siteSlug={site.slug} siteId={site.id} canEdit={canEdit} />
        </section>
      </main>
    </div>
  );
}
