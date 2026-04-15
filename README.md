# CMS PageBlanche

Le projet est conteneurisé avec Docker et est déployé sur un VPS via un reverse proxy avec Traefik.

## Sommaire

1. [Technologies utilisées](#technologies-utilisées)
2. [Fonctionnalités Principales](#fonctionnalités-principales)
3. [Architecture & Déploiement Docker](#architecture--déploiement-docker)
   - [Prérequis](#prérequis)
   - [Lancement en Local](#lancement-en-local)
   - [Déploiement en Production (VPS)](#déploiement-en-production-vps)
4. [Visuel](#visuel)
5. [Auteur](#auteur)
6. [Licence](#licence)

## Technologies utilisées

- **[Next.js (App Router)](https://nextjs.org/)** : Framework React propulsant le front-end et le back-end (API Routes, Middleware multi-domaines).
- **[Prisma & MySQL](https://www.prisma.io/)** : ORM et base de données relationnelle pour le stockage des sites, pages, et utilisateurs.
- **[NextAuth.js](https://next-auth.js.org/)** : Authentification sécurisée des créateurs et administrateurs.
- **[Tailwind CSS](https://tailwindcss.com/)** : Framework CSS utilitaire.
- **[Zustand & dnd-kit](https://dndkit.com/)** : Gestion de l'état global et système de glisser-déposer (drag-and-drop) de l'éditeur "no-code".
- **[Docker & Traefik](https://traefik.io/)** : Déploiement conteneurisé, reverse-proxy natif et création automatique des certificats SSL/TLS.

## Fonctionnalités Principales

- **Constructeur de page No-Code** : Éditeur visuel interactif basé sur un système de blocs pour créer vos propres arborescences de page.
- **Routage Multi-Locataires (Multi-Tenant)** : Le CMS gère automatiquement l'affichage. En interne, visualisez vos sites sur `/view/mon-site`. Visités depuis le domaine final personnalisé, les sous-chemins se réécrivent automatiquement en racine. Les liens dans l'éditeur s'adaptent d'eux-mêmes !
- **Sélecteur d'environnement DB** : Le projet jongle dynamiquement entre `DEV_DATABASE_URL` et `PROD_DATABASE_URL` pour prévenir les accidents.

## Architecture & Déploiement Docker

### Prérequis

Pour lancer ce projet, vous avez besoin de :
- Docker et Docker Compose
- Git
- *(En production)* : Un serveur VPS avec les ports 80 et 443 ouverts, et un nom de domaine ciblant son adresse IP.

### Lancement en Local

Pour tester le projet en local :

1. Cloner le repository dans un dossier :
```bash
git clone <url-du-depot> .
```

2. Configurer les variables d'environnement à la racine :
```bash
cp .env.example .env
```
Assurez-vous que `DEV_DATABASE_URL` est bien défini, ainsi qu'un `NEXTAUTH_SECRET`.

3. Si vous n'utilisez pas de reverse-proxy local, modifiez le port exposé l'application dans `docker-compose.yml` (service `app`) :
```yaml
ports:
  - "8080:3000"
```

4. Lancer les conteneurs via Docker Compose (`-d` pour lancer en arrière-plan, `--build` pour construire l'image Next.js) :
```bash
docker compose up -d --build
```

5. L'application est maintenant accessible sur : http://localhost:8080/

### Déploiement en Production (VPS)

Sur le serveur de production, l'application fonctionne derrière un reverse proxy Traefik pour distribuer correctement les requêtes (notamment pour les domaines personnalisés des clients).

1. Cloner le repository sur le VPS :
```bash
git clone <url-du-depot> .
```

2. Remplir le fichier `.env` avec les valeurs de production :
```text
APP_DOMAIN=domaine-du-cms.com
PROD_DATABASE_URL=mysql://user:pass@db:3306/db_name
NEXTAUTH_SECRET=votre-secret-long
```

3. Réseau Docker : Assurez-vous que le réseau externe pour Traefik existe (selon votre configuration serveur existante) ou laissez Docker Compose le construire. S'il doit être externe :
```bash
docker network create web
```

4. Mise en ligne :
```bash
docker compose up -d --build
```

L'application et les sites personnalisés de vos utilisateurs sont désormais en ligne et routés avec SSL actif via Traefik.

## Visuel

![Page d'accueil](img-readme/)

## Auteur

**[Nino Rameau](https://nino-rameau.fr)** - [LinkedIn](https://www.linkedin.com/in/nino-rameau-1a0636332) - [GitHub](https://github.com/Nino-Rameau)

## Licence

Réalisé dans le cadre scolaire en avril 2026.