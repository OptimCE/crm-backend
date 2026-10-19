# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `GET /dso/resolve` and `GET /dso/operators`, which prefill a meter's GRD from
  its address through the internal `dso-lookup` service (never an annex, never
  exposed itself). Advisory: `/dso/resolve` always answers 200 —
  `status: "unavailable"` when the service is off, down or slow — with warning
  codes `REGION_OUTSIDE_COMMUNITY_REGULATOR` and `EAN_SIBELGA_OUTSIDE_BRUSSELS`;
  `/dso/operators` answers `[]` then. `POST /meters` never calls it. Configured
  by `DSO_LOOKUP_URL` (empty = off, the default) and `DSO_LOOKUP_TIMEOUT_MS`
  (1000 per call).
- `meter_data.grd_source` (`auto` | `manual`) and `meter_data.grd_data_version`
  (the data release of an `auto` value), on the meter DTOs in and out. They
  travel with `grd`: a write without `grd` keeps all three.
  `2026-10-13_meter_data_grd_provenance.sql` adds them (optimce-migrator CRM
  migration 14 in production) and must be applied before this version runs.
- Address suggestions carry `post_name` on address rows: the Flemish postal
  name, else the Walloon part of municipality (`embed=partOfMunicipalities`).

### Changed

- `meter_data.grd` stores the operator's stable id (`ores`, `fluvius-imewo`,
  `elia`). A legacy display name ("ORES", "Fluvius Imewo") is rewritten to its
  id on input and by the 2026-10-13 script; any other value is kept as free
  text. `grd` longer than 64 characters is now a 422.

### Fixed

- `database_script/init.sql` (and `2026-05-03_sharing_operation_municipality.sql`)
  created `municipality_postal_code` without the `created_at` column its entity
  declares, so a database built from them failed every municipality read that
  loads postal codes. Both now carry it; `tests/sql/init.sql` always did.
  `2026-10-11_municipality_postal_code_created_at.sql` adds it to an existing
  database (optimce-migrator CRM migration 13 in production).
