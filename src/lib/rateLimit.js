const store = new Map();

// S4 — Nettoyage périodique pour éviter la fuite mémoire
// Toutes les 5 minutes, supprime les entrées expirées
const CLEANUP_INTERVAL_MS = 5 * 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref?.(); // .unref() empêche le timer de bloquer l'arrêt du process Node

/**
 * Rate limiter en mémoire (adapté pour déploiement mono-instance).
 * @param {string} key   - Clé unique (ex: "register:1.2.3.4")
 * @param {number} limit - Nombre max de tentatives dans la fenêtre
 * @param {number} windowMs - Durée de la fenêtre en millisecondes
 * @returns {{ success: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit({ key, limit = 10, windowMs = 60_000 }) {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count++;
  store.set(key, entry);

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
