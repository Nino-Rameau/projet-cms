import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const DYNAMIC_DIR = process.env.TRAEFIK_DYNAMIC_DIR || null;

// Sanitise le domaine pour l'utiliser comme nom de fichier/router
function safeName(domain) {
  return domain.replace(/[^a-zA-Z0-9-_.]/g, '_');
}

function buildConfig(domain) {
  const name = safeName(domain);
  return `# Généré automatiquement par le CMS — ne pas modifier manuellement
http:
  routers:
    cms-domain-${name}:
      rule: "Host(\`${domain}\`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: cms-svc-${name}
      priority: 5
    cms-domain-${name}-http:
      rule: "Host(\`${domain}\`)"
      entryPoints:
        - web
      middlewares:
        - cms-https-redirect-${name}
      service: cms-svc-${name}
      priority: 5
  middlewares:
    cms-https-redirect-${name}:
      redirectScheme:
        scheme: https
        permanent: true
  services:
    cms-svc-${name}:
      loadBalancer:
        servers:
          - url: "http://cms:3000"
`;
}

export async function registerDomain(domain) {
  if (!DYNAMIC_DIR || !domain) return;
  try {
    const path = join(DYNAMIC_DIR, `domain-${safeName(domain)}.yml`);
    await writeFile(path, buildConfig(domain), 'utf8');
  } catch {
    // Pas bloquant — HTTP fonctionne même sans ce fichier
  }
}

export async function unregisterDomain(domain) {
  if (!DYNAMIC_DIR || !domain) return;
  try {
    const path = join(DYNAMIC_DIR, `domain-${safeName(domain)}.yml`);
    await unlink(path);
  } catch {
    // Fichier déjà absent, pas grave
  }
}
