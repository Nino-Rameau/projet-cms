import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { updateAccountProfile, updateAccountPassword } from '@/app/actions/account';
import AppHeader from '@/components/ui/AppHeader';

function getProfileErrorMessage(code) {
  switch (code) {
    case 'email_required':
      return 'L\'email est obligatoire.';
    case 'name_too_long':
      return 'Le nom est trop long.';
    case 'email_taken':
      return 'Cet email est deja utilise par un autre compte.';
    default:
      return '';
  }
}

function getPasswordErrorMessage(code) {
  switch (code) {
    case 'missing_fields':
      return 'Tous les champs mot de passe sont requis.';
    case 'too_short':
      return 'Le nouveau mot de passe doit contenir au moins 8 caracteres.';
    case 'confirm_mismatch':
      return 'La confirmation ne correspond pas au nouveau mot de passe.';
    case 'current_required':
      return 'Le mot de passe actuel est requis.';
    case 'current_invalid':
      return 'Le mot de passe actuel est incorrect.';
    case 'user_not_found':
      return 'Compte introuvable.';
    default:
      return '';
  }
}

export default async function AccountSettingsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/');

  const resolvedSearchParams = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) return redirect('/dashboard');

  const profileError = getProfileErrorMessage(String(resolvedSearchParams?.profileError || ''));
  const passwordError = getPasswordErrorMessage(String(resolvedSearchParams?.passwordError || ''));
  const profileSuccess = resolvedSearchParams?.profileSuccess === 'updated';
  const passwordSuccess = resolvedSearchParams?.passwordSuccess === 'updated';

  return (
    <div className="min-h-screen bg-pb-background text-pb-foreground flex flex-col">
      <AppHeader>
          <ThemeToggle compact />
          <Link href="/dashboard" className="text-xs font-bold tracking-wider border border-pb-border px-3 py-1.5 rounded-md hover:bg-pb-border/30 transition">
            Dashboard
          </Link>
          <span className="text-sm font-medium">Bonjour, {user.name || user.email}</span>
          <div className="w-10 h-10 rounded-full border border-pb-border flex items-center justify-center font-bold uppercase overflow-hidden text-pb-foreground bg-pb-border/20">
            {user.name?.[0] || user.email?.[0] || '?'}
          </div>
          <SignOutButton />
      </AppHeader>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-xs font-semibold text-pb-foreground/60 hover:text-pb-accent mb-2">← Retour dashboard</Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Parametres du compte</h1>
            <p className="text-sm text-pb-foreground/60 mt-1">Modifiez vos informations personnelles et securisez votre acces.</p>
          </div>
        </div>

        {(profileError || passwordError) && (
          <div className="rounded-lg border border-red-300 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
            {profileError || passwordError}
          </div>
        )}

        {(profileSuccess || passwordSuccess) && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            {profileSuccess ? 'Profil mis a jour avec succes.' : 'Mot de passe mis a jour avec succes.'}
          </div>
        )}

        <section className="rounded-2xl border border-pb-border bg-pb-background p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
            <div>
              <h2 className="text-lg font-bold mb-2">Profil</h2>
              <p className="text-sm text-pb-foreground/60">Ces informations apparaissent dans ton espace dashboard.</p>
            </div>

            <form action={updateAccountProfile} className="space-y-4 w-full max-w-2xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pb-foreground/60 mb-1">Nom</label>
                <input
                  name="name"
                  defaultValue={user.name || ''}
                  placeholder="Votre nom"
                  className="w-full px-3 py-2.5 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pb-foreground/60 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email || ''}
                  placeholder="vous@exemple.com"
                  className="w-full px-3 py-2.5 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-pb-accent text-white font-bold rounded-md hover:brightness-110 transition-all text-sm shadow-md">
                Enregistrer le profil
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-pb-border bg-pb-background p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
            <div>
              <h2 className="text-lg font-bold mb-2">Mot de passe</h2>
              <p className="text-xs text-pb-foreground/60">
                {user.password ? 'Pour changer votre mot de passe, confirmez d\'abord votre mot de passe actuel.' : 'Aucun mot de passe defini. Vous pouvez en definir un maintenant.'}
              </p>
            </div>

            <form action={updateAccountPassword} className="space-y-4 w-full max-w-2xl">
              {user.password && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-pb-foreground/60 mb-1">Mot de passe actuel</label>
                  <input
                    name="currentPassword"
                    type="password"
                    placeholder="Mot de passe actuel"
                    className="w-full px-3 py-2.5 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pb-foreground/60 mb-1">Nouveau mot de passe</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Au moins 8 caracteres"
                  className="w-full px-3 py-2.5 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pb-foreground/60 mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Retapez le nouveau mot de passe"
                  className="w-full px-3 py-2.5 bg-pb-border/20 text-black border border-pb-border rounded-md text-sm focus:border-pb-accent focus:outline-none"
                />
              </div>

              <button type="submit" className="px-4 py-2 bg-pb-foreground text-pb-background font-bold rounded-md hover:opacity-90 transition-all text-sm shadow-md">
                Mettre a jour le mot de passe
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-pb-border bg-pb-background p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold mb-2">Informations</h2>
          <p className="text-sm text-pb-foreground/70">Compte cree le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(user.createdAt))}</p>
          <p className="text-sm text-pb-foreground/70 mt-1">ID compte: <span className="font-mono text-xs">{user.id}</span></p>
        </section>
      </main>
    </div>
  );
}
