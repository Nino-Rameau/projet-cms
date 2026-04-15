# PageBlanche CMS

CMS no-code base sur Next.js, Prisma et NextAuth.

## Stack

- Next.js (App Router)
- React
- Prisma + MySQL
- NextAuth (Credentials)
- Tailwind CSS
- Zustand + dnd-kit

## Prerequis

- Node.js 20+
- MySQL (local ou distant)

## Installation

```bash
npm install
```

## Configuration

1. Copier le fichier d'environnement:

```bash
cp .env.example .env
```

2. Mettre a jour les valeurs dans `.env`:

- `DATABASE_URL`: connexion MySQL Prisma
- `NEXTAUTH_SECRET`: secret long et aleatoire pour les JWT/sessions
- `NEXTAUTH_URL`: URL de l'app (ex: `http://localhost:3000`)

Exemple de generation de secret:

```bash
openssl rand -base64 32
```

## Base de donnees

Generer le client Prisma:

```bash
npx prisma generate
```

Appliquer les migrations (si vous utilisez Prisma Migrate):

```bash
npx prisma migrate dev
```

## Lancer le projet

Mode developpement:

```bash
npm run dev
```

Build production:

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev`: demarre le serveur de dev
- `npm run build`: build de production
- `npm run start`: lance le build
- `npm run lint`: lint (si configure)

## Deploiement VPS rapide (Docker + Traefik)

Le projet est full-stack Next.js (front + back dans le meme service) avec:

- MySQL en service separe
- Traefik en reverse proxy (routers + middlewares + TLS Let\'s Encrypt)

Fichiers fournis:

- `Dockerfile`
- `docker-compose.yml`
- `docker-entrypoint.sh`

### 1) Variables d'environnement (production)

Sur le serveur VPS, exportez ou placez ces variables dans un fichier `.env` a cote de `docker-compose.yml`:

```env
APP_DOMAIN=votre-domaine.com
LETSENCRYPT_EMAIL=vous@votre-domaine.com

MYSQL_ROOT_PASSWORD=change-root-password
MYSQL_DATABASE=pageblanche
MYSQL_USER=pageblanche
MYSQL_PASSWORD=change-db-password

NEXTAUTH_SECRET=change-me-with-a-long-random-secret
NEXTAUTH_URL=https://votre-domaine.com
```

Important:

- Le domaine doit deja pointer vers l'IP du VPS (DNS A/AAAA).
- Les ports 80 et 443 doivent etre ouverts.

### 2) Lancer en production

```bash
docker compose up -d --build
```

### 3) Suivre les logs

```bash
docker compose logs -f traefik
docker compose logs -f app
docker compose logs -f db
```

### 4) Mise a jour applicative

```bash
git pull
docker compose up -d --build
```

Notes:

- Le service `app` lance automatiquement `prisma db push` au demarrage.
- La base MySQL est persistante via le volume Docker `mysql_data`.
- Les certificats TLS sont persistes dans le volume `traefik_letsencrypt`.
- Le port MySQL n'est pas expose publiquement.

### A quoi sert `docker-entrypoint.sh` ?

Ce script est execute au demarrage du conteneur `app`, avant le lancement de Next.js.

Il sert a:

1. Synchroniser le schema Prisma avec la base (`npx prisma db push`).
2. Lancer ensuite l'application (`npm run start`).

L'interet en VPS: eviter d'oublier l'etape Prisma lors d'un redeploiement.

## Notes

- Les pages en `DRAFT` ne sont pas servies sur les URLs publiques `/view/...`.
- Les composants globaux (header/footer) sont edites separement et injectes sur toutes les pages.
