# Contributing to OptimCE CRM Backend

Thank you for your interest in contributing! Issues and pull requests are
welcome from everyone. By participating in this project, you agree to abide by
our [Code of Conduct](CODE_OF_CONDUCT.md).

## Where to Contribute

This repository holds the **CRM backend** service of the OptimCE platform, which
is split across several repositories under the
[OptimCE organization](https://github.com/OptimCE):

- Changes to the **CRM backend API** (this service) belong here.
- Changes that concern another service, or the development environment and
  orchestration (Docker Compose, the API gateway, authentication, the reverse
  proxy), belong in the relevant repository — see the
  [OptimCE/monorepo](https://github.com/OptimCE/monorepo) README for the
  repository map.

## Setting Up a Development Environment

```bash
git clone https://github.com/OptimCE/crm-backend.git
cd crm-backend
npm install
npm run dev
```

The [README](README.md) covers the prerequisites (Node.js 20.x), the
`config/*.cjs` files, and the available npm scripts. To run this service
alongside the rest of the platform (database, gateway, Keycloak, object
storage), use the full Docker Compose stack in
[OptimCE/monorepo](https://github.com/OptimCE/monorepo).

## Reporting Bugs and Suggesting Features

Open a [GitHub issue](https://github.com/OptimCE/crm-backend/issues). For bugs,
include what you did, what you expected, and what happened instead — logs and
reproduction steps help a lot.

For security vulnerabilities, **do not open a public issue**; follow the
[security policy](SECURITY.md) instead.

## Submitting Pull Requests

1. Fork the repository and create a feature branch from `main`.
2. Make your changes. Keep each pull request focused on a single topic.
3. Make sure the checks pass locally:

   ```bash
   npm run lint
   npm run test
   ```

   The Husky + lint-staged pre-commit hooks run Prettier and ESLint
   automatically; please don't bypass them. If you change SQL files, lint them
   with `sqlfluff` (see the [README](README.md#sql-linting)).
4. Open a pull request against `main`, describing **what** you changed and
   **why**.

For larger changes, opening an issue first to discuss the approach can save you
time. Small documentation fixes are welcome as direct pull requests.

## Commit Messages

Use short, imperative commit messages, preferably following the
[Conventional Commits](https://www.conventionalcommits.org/) style used in this
repository:

```
feat: add endpoint to export community members
fix: correct pagination on the meters listing
chore: bump typeorm to 0.3.28
docs: document the swagger generation scripts
```

## License

OptimCE is licensed under the [Apache License 2.0](LICENSE). By contributing,
you agree that your contributions will be licensed under the same license.
