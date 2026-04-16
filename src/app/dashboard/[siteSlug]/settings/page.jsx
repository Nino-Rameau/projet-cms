import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Settings, Users, LayoutDashboard, ExternalLink, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { updateSiteSettings } from '@/app/actions/site';
import DeleteSiteForm from '@/components/dashboard/DeleteSiteForm';

function getSettingsErrorMessage(code) {
  switch (code) {
    case 'read_only':
      return 'Vous etes en lecture seule sur ce site.';
    case 'site_access_denied':
      return 'Accès refusé à ce site.';
    case 'unauthorized':
      return 'Votre session a expiré, reconnectez-vous.';
    case 'settings_update_failed':
      return 'Impossible de mettre à jour les paramètres du site.';
    default:
      return code ? 'Une erreur est survenue. Veuillez reessayer.' : '';
  }
}

function getDangerErrorMessage(code) {
  switch (code) {
    case 'owner_required':
      return 'Seul un propriétaire peut supprimer ce site.';
    case 'site_delete_failed':
      return 'La suppression du site a échoué.';
    case 'unauthorized':
      return 'Votre session a expiré, reconnectez-vous.';
    default:
      return code ? 'Une erreur est survenue. Veuillez reessayer.' : '';
  }
}

export default async function SiteSettingsPage({ params, searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/');

  const resolvedSearchParams = await searchParams;

  const resolvedParams = await params;
  const siteSlug = resolvedParams.siteSlug;

  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      site: { slug: siteSlug },
    },
    include: {
      site: true,
    },
  });

  if (!membership) return redirect('/dashboard');

  const site = membership.site;
  const canEdit = membership.role !== 'READER';
  const settingsErrorMessage = getSettingsErrorMessage(String(resolvedSearchParams?.settingsError || ''));
  const settingsSuccess = String(resolvedSearchParams?.settingsSuccess || '') === 'updated';
  const dangerErrorMessage = getDangerErrorMessage(String(resolvedSearchParams?.dangerError || ''));

  return (
    <div className="flex flex-row min-h-screen font-sans bg-pb-background text-pb-foreground">
      <aside className="sticky top-0 flex flex-col w-64 h-screen px-4 py-8 border-r border-pb-border bg-pb-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-1 mb-10">
          <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-white uppercase rounded-lg shadow-lg bg-pb-accent">
            {site.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold leading-tight truncate max-w-[150px]">{site.name}</h1>
            <span className="text-xs text-pb-foreground/60">{site.isPublic ? 'En ligne' : 'Privé'}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href={`/dashboard/${site.slug}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-pb-border/40 text-pb-foreground/70 hover:text-pb-foreground font-medium group transition-all">
            <div className="flex items-center gap-3"><LayoutDashboard size={18} /> Pages</div>
            <ChevronRight size={16} className="transition-opacity opacity-0 group-hover:opacity-100" />
          </Link>
          <Link href={`/dashboard/${site.slug}/settings`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-pb-accent/10 text-pb-accent font-medium group transition-all">
            <div className="flex items-center gap-3"><Settings size={18} /> Paramètres Site</div>
            <ChevronRight size={16} className="transition-opacity opacity-0 group-hover:opacity-100" />
          </Link>
          <Link href={`/dashboard/${site.slug}/team`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-pb-border/40 text-pb-foreground/70 hover:text-pb-foreground font-medium group transition-all">
            <div className="flex items-center gap-3"><Users size={18} /> Équipe (Membres)</div>
            <ChevronRight size={16} className="transition-opacity opacity-0 group-hover:opacity-100" />
          </Link>
        </nav>

        <div className="px-2 mt-auto space-y-3">
          <ThemeToggle compact />
          <Link href="/dashboard" className="block text-xs text-center text-pb-foreground/60 hover:underline">← Retour aux sites</Link>
          <a
             href={site.domain && site.isPublic ? `https://${site.domain}` : `/view/${site.slug}/home`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold rounded-lg shadow-md bg-pb-foreground text-pb-background hover:opacity-90"
           >
             <ExternalLink size={16} /> Visiter le site
           </a>
        </div>
      </aside>

      <main className="flex-1 max-w-5xl p-8 overflow-y-auto md:p-12">
        <header className="pb-4 mb-8 border-b border-pb-border">
          <Link href={`/dashboard/${site.slug}`} className="inline-flex items-center mb-3 text-xs font-semibold text-pb-foreground/60 hover:text-pb-accent">← Retour à l'architecture</Link>
          <h2 className="mb-1 text-3xl font-extrabold tracking-tight">Paramètres du site</h2>
          <p className="text-pb-foreground/60">{canEdit ? 'Réglez la langue, la visibilité en ligne et les informations générales.' : 'Mode lecteur: consultation uniquement.'}</p>
        </header>

        {settingsErrorMessage && (
          <div className="px-4 py-3 mb-6 text-sm font-medium text-red-700 border border-red-300 rounded-lg bg-red-500/10">
            {settingsErrorMessage}
          </div>
        )}

        {settingsSuccess && (
          <div className="px-4 py-3 mb-6 text-sm font-medium border rounded-lg border-emerald-300 bg-emerald-500/10 text-emerald-700">
            Paramètres du site mis à jour.
          </div>
        )}

        <form action={updateSiteSettings} className="space-y-6">
          <input type="hidden" name="siteId" value={site.id} />
          <input type="hidden" name="siteSlug" value={site.slug} />

          <section className="p-5 space-y-4 border rounded-xl border-pb-border bg-pb-background/70">
            <h3 className="text-sm font-bold">Informations générales</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-semibold text-pb-foreground/70">Nom du site</label>
                <input
                  name="name"
                  defaultValue={site.name || ''}
                  required
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg border-pb-border bg-pb-background"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-pb-foreground/70">Domaine personnalisé (optionnel)</label>
                <input
                  name="domain"
                  defaultValue={site.domain || ''}
                  placeholder="ex: monsite.com"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg border-pb-border bg-pb-background"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-pb-foreground/70">Description du site</label>
              <textarea
                name="description"
                defaultValue={site.description || ''}
                rows={4}
                placeholder="Décrivez votre site en quelques lignes"
                disabled={!canEdit}
                className="w-full px-3 py-2 border rounded-lg border-pb-border bg-pb-background"
              />
            </div>
          </section>

          <section className="p-5 space-y-4 border rounded-xl border-pb-border bg-pb-background/70">
            <h3 className="text-sm font-bold">Langue et publication</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-semibold text-pb-foreground/70">Langue principale</label>
                <select name="language" defaultValue={site.language || 'fr'} disabled={!canEdit} className="w-full px-3 py-2 border rounded-lg border-pb-border bg-pb-background">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="p-3 border rounded-lg border-pb-border bg-pb-background/50">
                <label className="inline-flex items-start gap-3">
                  <input type="checkbox" name="isPublic" defaultChecked={Boolean(site.isPublic)} disabled={!canEdit} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold">Site en ligne publiquement</span>
                    <span className="block text-xs text-pb-foreground/60">
                      Si désactivé, le site n'est visible que par les membres connectés.
                    </span>
                  </span>
                </label>
              </div>

              <div className="p-3 border rounded-lg border-amber-300 bg-amber-50/60">
                <label className="inline-flex items-start gap-3">
                  <input type="checkbox" name="noIndex" defaultChecked={Boolean(site.noIndex)} disabled={!canEdit} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold text-amber-800">Bloquer l'indexation (noindex)</span>
                    <span className="block text-xs text-amber-700/80">
                      Interdit aux moteurs de recherche d'indexer ce site. Génère un <code className="px-1 font-mono rounded bg-amber-100">robots.txt</code> bloquant et retire le site du sitemap.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="p-5 space-y-3 border rounded-xl border-pb-border bg-pb-background/70">
            <h3 className="text-sm font-bold">SEO — Fichiers générés automatiquement</h3>
            <p className="text-xs text-pb-foreground/60">Ces fichiers sont générés en temps réel selon l'état du site.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <a
                href={site.domain && site.isPublic ? `https://${site.domain}/robots.txt` : `/view/${site.slug}/robots.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 font-mono text-sm transition border rounded-lg border-pb-border bg-pb-background/50 hover:bg-pb-border/20"
              >
                <ExternalLink size={13} className="shrink-0" />
                robots.txt
              </a>
              <a
                href={site.domain && site.isPublic ? `https://${site.domain}/sitemap.xml` : `/view/${site.slug}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 font-mono text-sm transition border rounded-lg border-pb-border bg-pb-background/50 hover:bg-pb-border/20"
              >
                <ExternalLink size={13} className="shrink-0" />
                sitemap.xml <span className='text-xs text-gray-500/60'>(Vide si le site bloque l'indexation)</span>
              </a>
            </div>
          </section>

          {canEdit && (
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 font-semibold text-white transition rounded-lg bg-pb-accent hover:brightness-110">
                Enregistrer les paramètres
              </button>
            </div>
          )}
        </form>

        {site.domain && site.isPublic && (
          <section className="p-5 mt-6 space-y-4 border rounded-xl border-emerald-300 bg-emerald-50/60">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-emerald-800">Déploiement actif — {site.domain}</h3>
            </div>
            <p className="text-sm text-emerald-800/80">
              Votre site est en ligne. Pour qu'il soit accessible via <strong>{site.domain}</strong>, faites pointer ce domaine vers l'IP de votre VPS en ajoutant un enregistrement DNS de type <strong>A</strong>.
            </p>
            <div className="px-4 py-3 space-y-1 font-mono text-sm bg-white border rounded-lg border-emerald-200 text-slate-700">
              <p><span className="font-bold text-emerald-700">Type :</span> A</p>
              <p><span className="font-bold text-emerald-700">Nom :</span> @ (ou {site.domain})</p>
              <p><span className="font-bold text-emerald-700">Valeur :</span> {process.env.NEXT_PUBLIC_VPS_IP || '<IP de votre VPS>'}</p>
              <p><span className="font-bold text-emerald-700">TTL :</span> 3600 (ou Auto)</p>
            </div>
            <a
              href={`http://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
            >
              <ExternalLink size={14} /> Tester {site.domain}
            </a>
          </section>
        )}

        {site.domain && !site.isPublic && (
          <section className="p-5 mt-6 border rounded-xl border-amber-300 bg-amber-50/60">
            <p className="text-sm text-amber-800">
              Le domaine <strong>{site.domain}</strong> est configuré mais le site est en mode privé. Activez "Site en ligne publiquement" pour le déployer.
            </p>
          </section>
        )}

        {canEdit && (
          <section className="p-5 mt-8 space-y-4 border border-red-300 rounded-xl bg-red-50/60">
            <h3 className="text-sm font-bold text-red-700">Zone dangereuse</h3>
            <p className="text-sm text-red-700/90">
              Supprimer ce site efface définitivement les pages, les membres et la configuration associée.
            </p>
            {dangerErrorMessage && (
              <div className="px-4 py-3 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg">
                {dangerErrorMessage}
              </div>
            )}
            <DeleteSiteForm siteId={site.id} siteSlug={site.slug} siteName={site.name} />
          </section>
        )}
      </main>
    </div>
  );
}
