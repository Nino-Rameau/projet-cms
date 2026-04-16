import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Settings, Users, LayoutDashboard, ExternalLink, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { inviteSiteMember, updateSiteMemberRole } from '@/app/actions/site';
import RemoveMemberForm from '@/components/dashboard/RemoveMemberForm';

function getTeamErrorMessage(code) {
  switch (code) {
    case 'invite_email_required':
      return 'Veuillez saisir un email valide.';
    case 'invite_user_not_found':
      return 'Aucun compte ne correspond a cet email.';
    case 'owner_required':
      return 'Cette action nécessite un propriétaire.';
    case 'member_not_found':
      return 'Membre introuvable.';
    case 'site_access_denied':
      return 'Accès refusé à ce site.';
    case 'read_only':
      return 'Vous etes en lecture seule sur ce site.';
    case 'unauthorized':
      return 'Votre session a expiré, reconnectez-vous.';
    default:
      return code ? 'Une erreur est survenue. Veuillez reessayer.' : '';
  }
}

function getTeamSuccessMessage(code) {
  switch (code) {
    case 'member_invited':
      return 'Membre invité avec succès.';
    case 'member_role_updated':
      return 'Rôle du membre mis à jour.';
    case 'member_removed':
      return 'Membre retiré du site.';
    default:
      return '';
  }
}

export default async function SiteTeamPage({ params, searchParams }) {
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

  // P2 — Sélectionner uniquement les champs utilisateur nécessaires (évite de charger image, password, etc.)
  const members = await prisma.member.findMany({
    where: { siteId: site.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  const isOwner = membership.role === 'OWNER';
  const teamErrorMessage = getTeamErrorMessage(String(resolvedSearchParams?.teamError || ''));
  const teamSuccessMessage = getTeamSuccessMessage(String(resolvedSearchParams?.teamSuccess || ''));
  const roleLabel = (role) => {
    if (role === 'OWNER') return 'Propriétaire';
    if (role === 'READER') return 'Lecteur';
    return 'Éditeur';
  };

  return (
    <div className="min-h-screen bg-pb-background text-pb-foreground flex flex-row font-sans">
      <aside className="w-64 border-r border-pb-border bg-pb-background/70 backdrop-blur-sm flex flex-col h-screen sticky top-0 px-4 py-8">
        <div className="flex items-center gap-3 mb-10 px-2 py-1">
          <div className="w-10 h-10 bg-pb-accent rounded-lg flex items-center justify-center text-white font-bold text-xl uppercase shadow-lg">
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
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href={`/dashboard/${site.slug}/settings`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-pb-border/40 text-pb-foreground/70 hover:text-pb-foreground font-medium group transition-all">
            <div className="flex items-center gap-3"><Settings size={18} /> Paramètres Site</div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href={`/dashboard/${site.slug}/team`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-pb-accent/10 text-pb-accent font-medium group transition-all">
            <div className="flex items-center gap-3"><Users size={18} /> Équipe (Membres)</div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </nav>

        <div className="mt-auto px-2 space-y-3">
          <ThemeToggle compact />
          <Link href="/dashboard" className="text-xs text-pb-foreground/60 hover:underline block text-center">← Retour aux sites</Link>
          <Link href={`/view/${site.slug}/home`} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-pb-foreground text-pb-background rounded-lg text-sm font-semibold hover:opacity-90 shadow-md">
            <ExternalLink size={16} /> Visiter le site
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 md:p-12 max-w-5xl">
        <header className="mb-8 pb-4 border-b border-pb-border">
          <Link href={`/dashboard/${site.slug}`} className="inline-flex items-center text-xs font-semibold text-pb-foreground/60 hover:text-pb-accent mb-3">← Retour à l'architecture</Link>
          <h2 className="text-3xl font-extrabold tracking-tight mb-1">Équipe du site</h2>
          <p className="text-pb-foreground/60">Gérez les membres et leurs rôles d'accès.</p>
        </header>

        {teamErrorMessage && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
            {teamErrorMessage}
          </div>
        )}

        {teamSuccessMessage && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            {teamSuccessMessage}
          </div>
        )}

        <section className="rounded-xl border border-pb-border bg-pb-background/70 p-5 mb-6">
          <h3 className="text-sm font-bold mb-3">Inviter un membre</h3>
          {isOwner ? (
            <form action={inviteSiteMember} className="grid md:grid-cols-4 gap-3 items-end">
              <input type="hidden" name="siteId" value={site.id} />
              <input type="hidden" name="siteSlug" value={site.slug} />

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-pb-foreground/70 mb-1">Email du compte existant</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="membre@exemple.com"
                  className="w-full px-3 py-2 border border-pb-border rounded-lg bg-pb-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pb-foreground/70 mb-1">Rôle</label>
                <select name="role" defaultValue="EDITOR" className="w-full px-3 py-2 border border-pb-border rounded-lg bg-pb-background">
                  <option value="EDITOR">Éditeur</option>
                  <option value="READER">Lecteur</option>
                  <option value="OWNER">Propriétaire</option>
                </select>
              </div>

              <button type="submit" className="px-4 py-2 rounded-lg bg-pb-accent text-white font-semibold hover:brightness-110 transition">
                Inviter
              </button>
            </form>
          ) : (
            <p className="text-sm text-pb-foreground/60">Seul un propriétaire peut inviter ou modifier des membres.</p>
          )}
        </section>

        <section className="rounded-xl border border-pb-border bg-pb-background overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-pb-border/20 border-b border-pb-border text-xs font-semibold text-pb-foreground/60 uppercase tracking-wider">
            <div className="col-span-5">Membre</div>
            <div className="col-span-3">Rôle</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          <div className="divide-y divide-pb-border">
            {members.map((m) => {
              const isCurrentUser = m.userId === session.user.id;
              const canEdit = isOwner && !isCurrentUser;

              return (
                <div key={m.id} className="grid grid-cols-12 px-5 py-4 items-center">
                  <div className="col-span-5 pr-3">
                    <div className="font-semibold truncate">{m.user?.name || m.user?.email || 'Utilisateur'}</div>
                    <div className="text-xs text-pb-foreground/60 truncate">{m.user?.email || 'email non disponible'}</div>
                  </div>

                  <div className="col-span-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${m.role === 'OWNER' ? 'bg-pb-accent/15 text-pb-accent' : m.role === 'READER' ? 'bg-slate-200 text-slate-700' : 'bg-pb-border/40 text-pb-foreground/70'}`}>
                      {roleLabel(m.role)}
                    </span>
                  </div>

                  <div className="col-span-4 flex items-center justify-end gap-2">
                    {canEdit ? (
                      <>
                        <form action={updateSiteMemberRole}>
                          <input type="hidden" name="siteId" value={site.id} />
                          <input type="hidden" name="siteSlug" value={site.slug} />
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="role" value="OWNER" />
                          <button className="px-3 py-1.5 rounded-lg border border-pb-border text-xs font-semibold hover:bg-pb-border/30 transition">
                            Définir propriétaire
                          </button>
                        </form>

                        <form action={updateSiteMemberRole}>
                          <input type="hidden" name="siteId" value={site.id} />
                          <input type="hidden" name="siteSlug" value={site.slug} />
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="role" value="EDITOR" />
                          <button className="px-3 py-1.5 rounded-lg border border-pb-border text-xs font-semibold hover:bg-pb-border/30 transition">
                            Définir éditeur
                          </button>
                        </form>

                        <form action={updateSiteMemberRole}>
                          <input type="hidden" name="siteId" value={site.id} />
                          <input type="hidden" name="siteSlug" value={site.slug} />
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="role" value="READER" />
                          <button className="px-3 py-1.5 rounded-lg border border-pb-border text-xs font-semibold hover:bg-pb-border/30 transition">
                            Définir lecteur
                          </button>
                        </form>

                        <RemoveMemberForm siteId={site.id} siteSlug={site.slug} memberId={m.id} />
                      </>
                    ) : (
                      <span className="text-xs text-pb-foreground/50">{isCurrentUser ? `Vous (${roleLabel(m.role)})` : 'Lecture seule'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
