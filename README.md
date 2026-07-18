<p align="center">
  <img src="docs/logo.svg" alt="OptimCE logo" width="160">
</p>

# OptimCE CRM — Backend

[![Website](https://img.shields.io/badge/Website-optimce.be-2e7d32.svg)](https://www.optimce.be/en/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![en](https://img.shields.io/badge/lang-en-43a047.svg)](README.md)
[![fr](https://img.shields.io/badge/lang-fr-lightgrey.svg)](docs/README.fr.md)
[![de](https://img.shields.io/badge/lang-de-lightgrey.svg)](docs/README.de.md)
[![nl](https://img.shields.io/badge/lang-nl-lightgrey.svg)](docs/README.nl.md)

The CRM backend API of [OptimCE](https://www.optimce.be/en/), an open-source
platform for managing renewable energy communities in the Belgian
energy-sharing context. This service exposes the core CRM domain — members,
communities, meters, allocation keys, sharing operations, documents,
invitations, notifications, and an audit log — as a REST API written in
TypeScript. It sits behind the platform's API gateway and trusts the
Keycloak-based authentication performed there.

## Part of the OptimCE Platform

This repository is one service of the wider OptimCE platform. It is included as
a git submodule in the [OptimCE/monorepo](https://github.com/OptimCE/monorepo)
development monorepo, which provides the Docker Compose environment (database,
API gateway, Keycloak, object storage, and the other services) to run the whole
platform locally. If you want to run this backend together with the rest of the
stack, start from the monorepo. This README covers working on the backend on its
own.

## Tech Stack

- **Runtime**: Node.js 20.x, TypeScript, [Express 5](https://expressjs.com/)
- **Persistence**: PostgreSQL via [TypeORM](https://typeorm.io/) and `pg`
- **Dependency injection**: [Inversify](https://inversify.io/)
- **Auth**: gateway-provided identity + [Keycloak admin client](https://www.npmjs.com/package/@keycloak/keycloak-admin-client)
- **Object storage**: AWS S3 SDK (MinIO-compatible)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/) + [Pino](https://getpino.io/)
- **Tooling**: Jest, ESLint, Prettier, Husky, `sqlfluff`

## Getting Started

### Prerequisites

- Node.js 20.x (recommended) or 18+
- npm (or `pnpm`/`yarn` if you prefer)
- Docker & Docker Compose (if running via containers)

It is recommended to use a Node version manager (e.g. `fnm` or `nvm`):

```bash
# install nvm (if needed) /!\ Windows: see https://fnm.vercel.app for installation
curl -fsSL https://fnm.vercel.app/install | bash
# then install Node 20
nvm install 20
nvm use 20
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OptimCE/crm-backend.git
   cd crm-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the environment. Environment-specific configuration lives in
   `config/`: `development.cjs`, `production.cjs`, `test.cjs`. You can set
   global environment variables (e.g. `NODE_ENV`, database connection, etc.)
   before running the application — check the `config/*.cjs` files for the exact
   list of expected variables.

## Useful Commands

- Start in development mode (live reload via `tsx watch`):

  ```bash
  npm run dev
  ```

- Build and copy assets:

  ```bash
  npm run build
  ```

- Start the built version:

  ```bash
  npm run start
  ```

- Run tests:

  ```bash
  npm run test
  # unit tests
  npm run test:unit
  # functional tests
  npm run test:functional
  ```

- Lint and format:

  ```bash
  npm run lint
  npm run format
  ```

- Generate Swagger/OpenAPI documentation (markdown or HTML):

  ```bash
  npm run swagger:doc:md
  npm run swagger:doc:html
  ```

- Generate TypeDoc documentation:

  ```bash
  npm run typedoc:md
  npm run typedoc:html
  ```

## Running via Docker

### Devcontainer

If you use one of these IDEs you can use a devcontainer to get a working
environment faster:

- Visual Studio Code → https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm → https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

The [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) file
contains the configuration that lets your IDE develop directly from the
container.

### Simulated "Production" Environment

For integration testing and a complete simulated environment, refer to the
parent [monorepo](https://github.com/OptimCE/monorepo) stack. It validates
integration and builds Docker images on the fly, but does not cover scalability
or high-availability aspects.

## Database

The SQL initialization script is located in `database_script/init.sql`. When
using Docker Compose, the database can be initialized automatically according to
the compose configuration; otherwise import it manually:

```bash
# example for psql
psql <database-connection-string> -f database_script/init.sql
```

### SQL Linting

Use `sqlfluff` to lint SQL files:

- `sqlfluff fix database_script/init.sql --dialect postgres` — fix SQL linting
  violations in the init script
- `sqlfluff fix tests/sql/init.sql --dialect postgres` — fix SQL linting
  violations in the test init script

## Internationalization

Translation files live in `assets/` (`en/`, `fr/`, `de/`, `nl/`).

## Observability

OpenTelemetry is configured in the project (see the `@opentelemetry/*`
dependencies). Variables such as `OTEL_EXPORTER_OTLP_ENDPOINT` or
`OTEL_LOGS_EXPORTER` can be set as needed. You can also launch the app with
tracing/logging enabled:

```bash
npm run trace
```

## Project Structure (selection)

- `src/` — TypeScript source code (domain modules under `src/modules/`, shared
  infrastructure under `src/shared/`)
- `assets/` — i18n translation files
- `config/` — environment-specific configuration files
- `database_script/` — database initialization scripts
- `docs/` — generated API docs (OpenAPI) and translated READMEs
- `tests/` — unit and functional test suites

## Contributing

Contributions are welcome! Please read the
[contributing guidelines](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md) before opening an issue or pull request.

## Security

To report a security vulnerability, please follow the
[security policy](SECURITY.md) — do not open a public issue.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
