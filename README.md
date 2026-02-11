# OptimCE CRM - Backend

> Backend du module CRM d'OptimCE (TypeScript / Node.js).

## Vue d'ensemble

Ce dépôt contient l'API backend écrite en TypeScript. Il utilise Express, TypeORM, OpenTelemetry et plusieurs outils de développement (TSX, Jest, ESLint, Prettier). La configuration par environnement se trouve dans le dossier `config/`.

## Prérequis

- Node.js 20.x (recommandé) ou 18+
- npm (ou `pnpm`/`yarn` si vous préférez)
- Docker & Docker Compose (si vous lancez l'environnement via containers)

Il est recommandé d'utiliser un gestionnaire de versions pour Node (par ex. `fnm` ou `nvm`). Exemples d'installation :

```bash
# installer nvm (si nécessaire) /!\ Windows vérifier directement https://fnm.vercel.app pour l'intallation
curl -fsSL https://fnm.vercel.app/install | bash
# ou utiliser nvm
# puis installer Node 20
nvm install 20
nvm use 20
```

## Installation locale

1. Cloner le dépôt et se placer à la racine :

```bash
git clone <repo-url>
cd crm-backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Copier/adapter la configuration d'environnement si nécessaire.
Les fichiers de configuration par environnement sont dans `config/` : `development.cjs`, `production.cjs`, `test.cjs`.
Vous pouvez définir les variables d'environnement globales (ex. `NODE_ENV`, `DATABASE_URL`, etc.) avant de lancer l'application. Vérifiez les fichiers `config/*.cjs` pour la liste exacte des variables attendues.

## Commandes utiles

- Démarrer en mode développement (live reload via `tsx watch`) :

```bash
npm run dev
```

- Compiler et copier les assets :

```bash
npm run build
```

- Démarrer la version buildée :

```bash
npm run start
```

- Exécuter les tests :

```bash
npm run test
# tests unitaires
npm run test:unit
# tests fonctionnels
npm run test:functional
```

- Linter et format :

```bash
npm run lint
npm run format
```

- Générer la documentation Swagger (markdown ou HTML) :

```bash
npm run swagger:doc:md
npm run swagger:doc:html
```

- Générer la documentation TypeDoc :

```bash
npm run typedoc:md
npm run typedoc:html
```

## Exécution via Docker / Docker Compose
### Installation
Suivre la documentation officielle selon votre plateforme.
- Linux (Natif) -> https://docs.docker.com/engine/install/
- Mac/Windows (Machine Virtuelle)-> https://docs.docker.com/get-started/get-docker/
### Utilisation
Le projet contient `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml` et `docker-compose.dev.yml` pour faciliter le démarrage.

Exemple (mode développement) :

```bash
docker compose -f docker-compose.dev.yml up --build
```

Pour production (ou déploiement local) :

```bash
docker compose up --build -d
```

Vérifiez les services définis dans les fichiers Compose si vous avez besoin d'une base de données locale, d'un service Keycloak, etc.

### Devcontainer
Si un de ces IDE vous pouvez utiliser un devcontainer pour avoir une architecture déployée plus rapidement :
- Visual Studio Code -> https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm -> https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

Le fichier [.devcontainer/.devcontainer.json](.devcontainer.json) contient une configuration permettant à votre IDE de développer directement depuis le container.
## Base de données

Le script d'initialisation SQL se trouve dans `sql/init.sql` et `database_script/init.sql`.
Si vous utilisez Docker Compose, la DB peut être initialisée automatiquement selon la configuration du compose ; sinon importez manuellement :

```bash
# exemple pour psql
psql <database-connection-string> -f sql/init.sql
```

## Internationalisation

Les fichiers de traduction sont dans `assets/` (`en/`, `fr/`, `de/`, `nl/`).

## Observabilité

OpenTelemetry est configuré dans le projet (voir dépendances `@opentelemetry/*`). Des variables comme `OTEL_EXPORTER_OTLP_ENDPOINT` ou `OTEL_LOGS_EXPORTER` peuvent être utilisées selon vos besoins.

## Structure du projet (sélection)

- `src/` : code source TypeScript
- `assets/` : i18n
- `config/` : fichiers de configuration par environnement
- `sql/` & `database_script/` : scripts d'initialisation DB
- `tests/` : suites de tests

## Débogage et traces

Vous pouvez lancer l'app avec des variables pour activer le tracing/logging :

```bash
npm run trace
```

## Contribuer

- Respectez les hooks `husky` et `lint-staged` avant les commits (formatage automatique via Prettier).
- Ouvrez des branches feature/bugfix et créez des PRs claires.
- Les forks et PRs sont acceptés.

## Ressources utiles dans le dépôt

- Fichiers de configuration : [config/](config)
- Docker compose (dev) : [docker-compose.dev.yml](docker-compose.dev.yml)
- SQL d'initialisation : [sql/init.sql](sql/init.sql) et [database_script/init.sql](database_script/init.sql)
- Scripts npm importants : `dev`, `build`, `start`, `test`, `lint`, `format` (voir `package.json`)
- Test unitaire et fonctionnel dans [tests](tests/) et de fichier mock pour les databases dans [tests/sql](tests/sql)