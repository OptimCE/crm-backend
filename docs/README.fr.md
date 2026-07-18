<p align="center">
  <img src="logo.svg" alt="Logo OptimCE" width="160">
</p>

# OptimCE CRM — Backend

[![Site web](https://img.shields.io/badge/Site%20web-optimce.be-2e7d32.svg)](https://www.optimce.be)
[![Licence](https://img.shields.io/badge/Licence-Apache%202.0-blue.svg)](../LICENSE)
[![en](https://img.shields.io/badge/lang-en-lightgrey.svg)](../README.md)
[![fr](https://img.shields.io/badge/lang-fr-43a047.svg)](README.fr.md)
[![de](https://img.shields.io/badge/lang-de-lightgrey.svg)](README.de.md)
[![nl](https://img.shields.io/badge/lang-nl-lightgrey.svg)](README.nl.md)

L'API backend du CRM d'[OptimCE](https://www.optimce.be), une plateforme open
source de gestion des communautés d'énergie renouvelable dans le contexte belge
du partage d'énergie. Ce service expose le cœur du domaine CRM — membres,
communautés, compteurs, clés de répartition, opérations de partage, documents,
invitations, notifications et journal d'audit — sous la forme d'une API REST
écrite en TypeScript. Il se place derrière la passerelle API de la plateforme et
fait confiance à l'authentification Keycloak qui y est réalisée.

## Composant de la plateforme OptimCE

Ce dépôt est l'un des services de la plateforme OptimCE. Il est inclus comme
sous-module git dans le monorepo de développement
[OptimCE/monorepo](https://github.com/OptimCE/monorepo), qui fournit
l'environnement Docker Compose (base de données, passerelle API, Keycloak,
stockage objet et les autres services) pour exécuter l'ensemble de la plateforme
en local. Pour exécuter ce backend avec le reste de la stack, partez du
monorepo. Ce README couvre le travail sur le backend de façon autonome.

## Pile technique

- **Runtime** : Node.js 20.x, TypeScript, [Express 5](https://expressjs.com/)
- **Persistance** : PostgreSQL via [TypeORM](https://typeorm.io/) et `pg`
- **Injection de dépendances** : [Inversify](https://inversify.io/)
- **Authentification** : identité fournie par la passerelle + [client admin Keycloak](https://www.npmjs.com/package/@keycloak/keycloak-admin-client)
- **Stockage objet** : SDK AWS S3 (compatible MinIO)
- **Internationalisation** : [i18next](https://www.i18next.com/)
- **Observabilité** : [OpenTelemetry](https://opentelemetry.io/) + [Pino](https://getpino.io/)
- **Outillage** : Jest, ESLint, Prettier, Husky, `sqlfluff`

## Prise en main

### Prérequis

- Node.js 20.x (recommandé) ou 18+
- npm (ou `pnpm`/`yarn` si vous préférez)
- Docker & Docker Compose (si vous exécutez via des conteneurs)

Il est recommandé d'utiliser un gestionnaire de versions Node (p. ex. `fnm` ou
`nvm`) :

```bash
# installer nvm (si nécessaire) /!\ Windows : voir https://fnm.vercel.app pour l'installation
curl -fsSL https://fnm.vercel.app/install | bash
# puis installer Node 20
nvm install 20
nvm use 20
```

### Installation

1. Clonez le dépôt :

   ```bash
   git clone https://github.com/OptimCE/crm-backend.git
   cd crm-backend
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Configurez l'environnement. La configuration propre à chaque environnement se
   trouve dans `config/` : `development.cjs`, `production.cjs`, `test.cjs`. Vous
   pouvez définir des variables d'environnement globales (p. ex. `NODE_ENV`, la
   connexion à la base de données, etc.) avant de lancer l'application —
   consultez les fichiers `config/*.cjs` pour la liste exacte des variables
   attendues.

## Commandes utiles

- Démarrer en mode développement (rechargement à chaud via `tsx watch`) :

  ```bash
  npm run dev
  ```

- Compiler et copier les assets :

  ```bash
  npm run build
  ```

- Démarrer la version compilée :

  ```bash
  npm run start
  ```

- Lancer les tests :

  ```bash
  npm run test
  # tests unitaires
  npm run test:unit
  # tests fonctionnels
  npm run test:functional
  ```

- Linter et formater :

  ```bash
  npm run lint
  npm run format
  ```

- Générer la documentation Swagger/OpenAPI (markdown ou HTML) :

  ```bash
  npm run swagger:doc:md
  npm run swagger:doc:html
  ```

- Générer la documentation TypeDoc :

  ```bash
  npm run typedoc:md
  npm run typedoc:html
  ```

## Exécution via Docker

### Devcontainer

Si vous utilisez l'un de ces IDE, vous pouvez utiliser un devcontainer pour
obtenir plus rapidement un environnement de travail :

- Visual Studio Code → https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm → https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

Le fichier [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json)
contient la configuration qui permet à votre IDE de développer directement
depuis le conteneur.

### Environnement « production » simulé

Pour les tests d'intégration et un environnement simulé complet, référez-vous à
la stack du [monorepo](https://github.com/OptimCE/monorepo) parent. Elle valide
l'intégration et construit les images Docker à la volée, mais ne couvre pas les
aspects de scalabilité ou de haute disponibilité.

## Base de données

Le script d'initialisation SQL se trouve dans `database_script/init.sql`. Avec
Docker Compose, la base de données peut être initialisée automatiquement selon
la configuration compose ; sinon, importez-le manuellement :

```bash
# exemple pour psql
psql <chaine-de-connexion-base-de-donnees> -f database_script/init.sql
```

### Linting SQL

Utilisez `sqlfluff` pour linter les fichiers SQL :

- `sqlfluff fix database_script/init.sql --dialect postgres` — corrige les
  violations de linting SQL dans le script d'initialisation
- `sqlfluff fix tests/sql/init.sql --dialect postgres` — corrige les violations
  de linting SQL dans le script d'initialisation de test

## Internationalisation

Les fichiers de traduction se trouvent dans `assets/` (`en/`, `fr/`, `de/`,
`nl/`).

## Observabilité

OpenTelemetry est configuré dans le projet (voir les dépendances
`@opentelemetry/*`). Des variables comme `OTEL_EXPORTER_OTLP_ENDPOINT` ou
`OTEL_LOGS_EXPORTER` peuvent être définies selon les besoins. Vous pouvez aussi
lancer l'application avec le traçage/journalisation activé :

```bash
npm run trace
```

## Structure du projet (sélection)

- `src/` — code source TypeScript (modules métier dans `src/modules/`,
  infrastructure partagée dans `src/shared/`)
- `assets/` — fichiers de traduction i18n
- `config/` — fichiers de configuration propres à chaque environnement
- `database_script/` — scripts d'initialisation de la base de données
- `docs/` — documentation d'API générée (OpenAPI) et READMEs traduits
- `tests/` — suites de tests unitaires et fonctionnels

## Contribuer

Les contributions sont les bienvenues ! Merci de lire le
[guide de contribution](../CONTRIBUTING.md) et notre
[code de conduite](../CODE_OF_CONDUCT.md) (en anglais) avant d'ouvrir une issue
ou une pull request.

## Sécurité

Pour signaler une faille de sécurité, veuillez suivre la
[politique de sécurité](../SECURITY.md) — n'ouvrez pas d'issue publique.

## Licence

Ce projet est distribué sous la [licence Apache 2.0](../LICENSE).
