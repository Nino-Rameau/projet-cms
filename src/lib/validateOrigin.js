import { headers } from 'next/headers';

/**
 * S1 — Validation CSRF par vérification de l'origin/referer.
 * Lève une erreur si la requête provient d'un domaine non autorisé.
 * En développement, la validation est désactivée.
 */
export async function validateOrigin() {
  if (process.env.NODE_ENV === 'development') return;

  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (!appUrl) return; // Ne peut pas valider sans URL de base

  let allowedOrigin;
  try {
    allowedOrigin = new URL(appUrl).origin;
  } catch {
    return; // URL malformée, impossible de valider
  }

  const headersList = await headers();
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');

  if (origin) {
    if (origin !== allowedOrigin) {
      throw new Error('CSRF: origin non autorisé');
    }
    return;
  }

  if (referer) {
    let refererOrigin;
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      throw new Error('CSRF: referer invalide');
    }
    if (refererOrigin !== allowedOrigin) {
      throw new Error('CSRF: referer non autorisé');
    }
  }
}
