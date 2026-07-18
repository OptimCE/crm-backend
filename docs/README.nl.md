<p align="center">
  <img src="logo.svg" alt="OptimCE-logo" width="160">
</p>

# OptimCE CRM — Backend

[![Website](https://img.shields.io/badge/Website-optimce.be-2e7d32.svg)](https://www.optimce.be/nl/)
[![Licentie](https://img.shields.io/badge/Licentie-Apache%202.0-blue.svg)](../LICENSE)
[![en](https://img.shields.io/badge/lang-en-lightgrey.svg)](../README.md)
[![fr](https://img.shields.io/badge/lang-fr-lightgrey.svg)](README.fr.md)
[![de](https://img.shields.io/badge/lang-de-lightgrey.svg)](README.de.md)
[![nl](https://img.shields.io/badge/lang-nl-43a047.svg)](README.nl.md)

De CRM-backend-API van [OptimCE](https://www.optimce.be/nl/), een
opensourceplatform voor het beheer van hernieuwbare-energiegemeenschappen in de
Belgische context van energiedelen. Deze service stelt de kern van het
CRM-domein — leden, gemeenschappen, meters, verdeelsleutels, deelverrichtingen,
documenten, uitnodigingen, meldingen en een auditlog — beschikbaar als een in
TypeScript geschreven REST-API. Ze bevindt zich achter de API-gateway van het
platform en vertrouwt op de Keycloak-authenticatie die daar wordt uitgevoerd.

## Onderdeel van het OptimCE-platform

Deze repository is een van de services van het OptimCE-platform. Ze is als
git-submodule opgenomen in de ontwikkelingsmonorepo
[OptimCE/monorepo](https://github.com/OptimCE/monorepo), die de Docker
Compose-omgeving levert (database, API-gateway, Keycloak, objectopslag en de
overige services) om het volledige platform lokaal te draaien. Wil je deze
backend samen met de rest van de stack draaien, begin dan bij de monorepo. Dit
README behandelt het zelfstandig werken aan de backend.

## Technologiestack

- **Runtime**: Node.js 20.x, TypeScript, [Express 5](https://expressjs.com/)
- **Persistentie**: PostgreSQL via [TypeORM](https://typeorm.io/) en `pg`
- **Dependency injection**: [Inversify](https://inversify.io/)
- **Authenticatie**: door de gateway geleverde identiteit + [Keycloak-adminclient](https://www.npmjs.com/package/@keycloak/keycloak-admin-client)
- **Objectopslag**: AWS S3-SDK (MinIO-compatibel)
- **Internationalisatie**: [i18next](https://www.i18next.com/)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/) + [Pino](https://getpino.io/)
- **Tooling**: Jest, ESLint, Prettier, Husky, `sqlfluff`

## Aan de slag

### Vereisten

- Node.js 20.x (aanbevolen) of 18+
- npm (of `pnpm`/`yarn` als je dat verkiest)
- Docker & Docker Compose (bij uitvoeren via containers)

Het is aanbevolen om een Node-versiebeheerder te gebruiken (bv. `fnm` of
`nvm`):

```bash
# nvm installeren (indien nodig) /!\ Windows: zie https://fnm.vercel.app voor de installatie
curl -fsSL https://fnm.vercel.app/install | bash
# installeer daarna Node 20
nvm install 20
nvm use 20
```

### Installatie

1. Kloon de repository:

   ```bash
   git clone https://github.com/OptimCE/crm-backend.git
   cd crm-backend
   ```

2. Installeer de afhankelijkheden:

   ```bash
   npm install
   ```

3. Configureer de omgeving. De omgevingsspecifieke configuratie staat in
   `config/`: `development.cjs`, `production.cjs`, `test.cjs`. Je kunt vóór het
   starten van de applicatie globale omgevingsvariabelen instellen (bv.
   `NODE_ENV`, de databaseverbinding, enz.) — raadpleeg de bestanden
   `config/*.cjs` voor de exacte lijst van verwachte variabelen.

## Nuttige commando's

- Starten in ontwikkelingsmodus (live herladen via `tsx watch`):

  ```bash
  npm run dev
  ```

- Bouwen en assets kopiëren:

  ```bash
  npm run build
  ```

- De gebouwde versie starten:

  ```bash
  npm run start
  ```

- Tests uitvoeren:

  ```bash
  npm run test
  # unittests
  npm run test:unit
  # functionele tests
  npm run test:functional
  ```

- Linten en formatteren:

  ```bash
  npm run lint
  npm run format
  ```

- Swagger/OpenAPI-documentatie genereren (markdown of HTML):

  ```bash
  npm run swagger:doc:md
  npm run swagger:doc:html
  ```

- TypeDoc-documentatie genereren:

  ```bash
  npm run typedoc:md
  npm run typedoc:html
  ```

## Uitvoeren via Docker

### Devcontainer

Als je een van deze IDE's gebruikt, kun je een devcontainer gebruiken om sneller
een werkende omgeving te krijgen:

- Visual Studio Code → https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm → https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

Het bestand [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json)
bevat de configuratie waarmee je IDE rechtstreeks vanuit de container kan
ontwikkelen.

### Gesimuleerde "productieomgeving"

Voor integratietests en een volledig gesimuleerde omgeving verwijzen we naar de
stack van de bovenliggende [monorepo](https://github.com/OptimCE/monorepo). Die
valideert de integratie en bouwt de Docker-images on the fly, maar dekt geen
schaalbaarheids- of hoge-beschikbaarheidsaspecten.

## Database

Het SQL-initialisatiescript bevindt zich in `database_script/init.sql`. Met
Docker Compose kan de database automatisch worden geïnitialiseerd volgens de
compose-configuratie; importeer het anders handmatig:

```bash
# voorbeeld voor psql
psql <database-verbindingsstring> -f database_script/init.sql
```

### SQL-linting

Gebruik `sqlfluff` om SQL-bestanden te linten:

- `sqlfluff fix database_script/init.sql --dialect postgres` — corrigeert
  SQL-lintingfouten in het initialisatiescript
- `sqlfluff fix tests/sql/init.sql --dialect postgres` — corrigeert
  SQL-lintingfouten in het test-initialisatiescript

## Internationalisatie

De vertaalbestanden staan in `assets/` (`en/`, `fr/`, `de/`, `nl/`).

## Observability

OpenTelemetry is in het project geconfigureerd (zie de `@opentelemetry/*`-
afhankelijkheden). Variabelen zoals `OTEL_EXPORTER_OTLP_ENDPOINT` of
`OTEL_LOGS_EXPORTER` kunnen naar behoefte worden ingesteld. Je kunt de
applicatie ook starten met tracing/logging ingeschakeld:

```bash
npm run trace
```

## Projectstructuur (selectie)

- `src/` — TypeScript-broncode (domeinmodules onder `src/modules/`, gedeelde
  infrastructuur onder `src/shared/`)
- `assets/` — i18n-vertaalbestanden
- `config/` — omgevingsspecifieke configuratiebestanden
- `database_script/` — database-initialisatiescripts
- `docs/` — gegenereerde API-documentatie (OpenAPI) en vertaalde README's
- `tests/` — unit- en functionele testsuites

## Bijdragen

Bijdragen zijn welkom! Lees de [bijdragerichtlijnen](../CONTRIBUTING.md) en onze
[gedragscode](../CODE_OF_CONDUCT.md) (in het Engels) voordat je een issue of
pull request opent.

## Beveiliging

Volg het [beveiligingsbeleid](../SECURITY.md) om een kwetsbaarheid te melden —
open geen publieke issue.

## Licentie

Dit project is gelicentieerd onder de [Apache-licentie 2.0](../LICENSE).
