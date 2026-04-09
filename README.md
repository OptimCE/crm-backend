# OptimCE CRM - Backend

> Backend for the OptimCE CRM module (TypeScript / Node.js). Derived from the Locomotrice project.

## Overview

This repository contains the backend API written in TypeScript. It uses Express, TypeORM, OpenTelemetry, and several development tools (TSX, Jest, ESLint, Prettier). Environment-specific configuration is located in the `config/` folder.

## Prerequisites

- Node.js 20.x (recommended) or 18+
- npm (or `pnpm`/`yarn` if you prefer)
- Docker & Docker Compose (if running via containers)

It is recommended to use a Node version manager (e.g., `fnm` or `nvm`). Installation examples:

```bash
# install nvm (if needed) /!\ Windows check https://fnm.vercel.app for installation
curl -fsSL https://fnm.vercel.app/install | bash
# or use nvm
# then install Node 20
nvm install 20
nvm use 20
```

## Local Installation

1. Clone the repository and navigate to the root:

```bash
git clone <repo-url>
cd crm-backend
```

2. Install dependencies:

```bash
npm install
```

3. Copy/adapt environment configuration if needed.
   Environment-specific configuration files are in `config/`: `development.cjs`, `production.cjs`, `test.cjs`.
   You can set global environment variables (e.g., `NODE_ENV`, `DATABASE_URL`, etc.) before running the application. Check the `config/*.cjs` files for the exact list of expected variables.

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

- Generate Swagger documentation (markdown or HTML):

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

If you use one of these IDEs you can use a devcontainer to have a deployed architecture faster:

- Visual Studio Code -> https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm -> https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

The [.devcontainer/.devcontainer.json](.devcontainer.json) file contains configuration that allows your IDE to develop directly from the container.

### Simulated "Production" Environment

For integration testing and a complete simulated environment, please refer to the parent monorepo stack. It validates integration tests but does not cover scalability or high availability aspects. And build on the fly docker images.

## Database

The SQL initialization script is located in `sql/init.sql` and `database_script/init.sql`.
If using Docker Compose, the DB can be initialized automatically according to the compose configuration; otherwise import manually:

```bash
# example for psql
psql <database-connection-string> -f sql/init.sql
```

### SQL Linting

Use `sqlfluff` to lint SQL files:
- `sqlfluff fix database_script/init.sql --dialect postgres` - Fix SQL linting violations in the init.sql file
- `sqlfluff fix tests/sql/init.sql --dialect postgres` - Fix SQL linting violations in the test init.sql file


## Internationalization

Translation files are in `assets/` (`en/`, `fr/`, `de/`, `nl/`).

## Observability

OpenTelemetry is configured in the project (see `@opentelemetry/*` dependencies). Variables like `OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_LOGS_EXPORTER` can be used as needed.

## Project Structure (selection)

- `src/` : TypeScript source code
- `assets/` : i18n
- `config/` : environment-specific configuration files
- `sql/` & `database_script/` : DB initialization scripts
- `tests/` : test suites

## Debugging and Tracing

You can launch the app with variables to enable tracing/logging:

```bash
npm run trace
```

## Contributing

- Respect the `husky` and `lint-staged` hooks before commits (automatic formatting via Prettier).
- Ensure SQL files are properly linted using `sqlfluff` (see [SQL Linting](#sql-linting)).
- Create feature/bugfix branches and clear PRs.
- Forks and PRs are accepted.

## Useful Resources in the Repository

- Configuration files: [config/](config)
- Docker compose (dev): [docker-compose.dev.yml](docker-compose.dev.yml)
- SQL initialization: [sql/init.sql](sql/init.sql) and [database_script/init.sql](database_script/init.sql)
- Important npm scripts: `dev`, `build`, `start`, `test`, `lint`, `format` (see `package.json`)
- Unit and functional tests in [tests](tests/) and database mock files in [tests/sql](tests/sql)
