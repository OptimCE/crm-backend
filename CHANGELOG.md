# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `database_script/init.sql` (and `2026-05-03_sharing_operation_municipality.sql`)
  created `municipality_postal_code` without the `created_at` column its entity
  declares, so a database built from them failed every municipality read that
  loads postal codes. Both now carry it; `tests/sql/init.sql` always did.
  `2026-10-11_municipality_postal_code_created_at.sql` adds it to an existing
  database (optimce-migrator CRM migration 13 in production).
