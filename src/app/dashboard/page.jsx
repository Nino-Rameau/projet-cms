import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { createNewSite } from '@/app/actions/site';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AppHeader from '@/components/ui/AppHeader';

const GLOBAL_PAGE_SLUGS = new Set(['__global-header', '__global-footer']);

export default async function DashboardPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  
  if (!session) {
    return redirect('/');
  }

  // Récupérer les sites de l'utilisateur connecté via la table Members
  const userMemberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: {
      site: {
        include: { pages: true } // Pour savoir combien de pages il a etc..
      }
    }
  });

  const sites = userMemberships.map(m => m.site);

  const dashboardError = resolvedSearchParams?.error || '';
  const submittedName = resolvedSearchParams?.name ? decodeURIComponent(String(resolvedSearchParams.name)) : '';

  const getDashboardErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'site_slug_taken':
        return 'Ce nom de site est deja pris. Choisissez un nom different.';
      case 'site_name_required':
        return 'Veuillez saisir un nom de site.';
      case 'invalid_site_name':
        return 'Nom invalide: utilisez au moins une lettre ou un chiffre.';
      case 'site_create_failed':
        return 'La creation du site a echoue. Veuillez reessayer.';
      default:
        return '';
    }
  };

  const getDashboardSuccessMessage = (successCode) => {
    switch (successCode) {
      case 'site_deleted':
        return 'Site supprime avec succes.';
      default:
        return '';
    }
  };

  const errorMessage = getDashboardErrorMessage(String(dashboardError));
  const successMessage = getDashboardSuccessMessage(String(resolvedSearchParams?.success || ''));

  return (
    <div className="min-h-screen bg-pb-background text-pb-foreground flex flex-col">
      <AppHeader>
          <ThemeToggle compact />
          <Link href="/dashboard/setting" className="text-xs font-bold tracking-wider border border-pb-border px-3 py-1.5 rounded-md hover:bg-pb-border/30 transition">
            Mon compte
          </Link>
          <span className="text-sm font-medium">Bonjour, {session.user.name || session.user.email}</span>
          <div className="w-10 h-10 rounded-full border border-pb-border flex items-center justify-center font-bold uppercase overflow-hidden text-pb-foreground bg-pb-border/20">
             {session.user.name?.[0] || session.user.email[0]}
          </div>
          <SignOutButton />
      </AppHeader>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Mes Sites</h1>
          
          <form action={createNewSite} className="flex gap-2">
            <input 
              name="name" 
              required 
              defaultValue={submittedName}
              placeholder="Nom du nouveau site..." 
              className="px-4 py-2 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-pb-accent text-white font-bold rounded-md hover:brightness-110 transition-all text-sm shadow-md">
              + Créer
            </button>
          </form>
        </div>

        {sites.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-pb-border rounded-xl">
             <h2 className="text-gray-500 font-medium pb-2">Vous n'avez aucun site pour le moment.</h2>
             <p className="text-sm text-gray-400">Utilisez le formulaire ci-dessus pour lancer votre premier projet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div key={site.id} className="border border-pb-border rounded-xl p-6 bg-pb-background hover:border-pb-accent transition-colors shadow-sm flex flex-col justify-between group">
                <div>
                  <h2 className="text-xl font-bold mb-1 truncate">{site.name}</h2>
                  <div className="flex items-center justify-between mb-6">
                     <span className="text-xs text-pb-foreground/60 font-mono">/{site.slug}</span>
                     <span className="text-xs bg-pb-border/30 px-2 py-1 rounded">
                       {site.pages.filter((page) => !GLOBAL_PAGE_SLUGS.has(page.slug)).length} page(s)
                     </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Link 
                    href={`/dashboard/${site.slug}`}
                    className="flex-1 text-center bg-pb-foreground text-pb-background px-3 py-2 rounded-md font-bold text-sm hover:opacity-90 shadow-sm"
                  >
                    Gérer
                  </Link>
                  <Link 
                    href={`/view/${site.slug}/home`}
                    target="_blank"
                    className="flex-1 text-center border border-pb-border px-3 py-2 rounded-md font-bold text-sm hover:bg-pb-border/50 transition-colors"
                  >
                    Aperçu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
