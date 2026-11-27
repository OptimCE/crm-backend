<p align="center">
  <img src="logo.svg" alt="OptimCE-Logo" width="160">
</p>

# OptimCE CRM — Backend

[![Website](https://img.shields.io/badge/Website-optimce.be-2e7d32.svg)](https://www.optimce.be/de/)
[![Lizenz](https://img.shields.io/badge/Lizenz-Apache%202.0-blue.svg)](../LICENSE)
[![en](https://img.shields.io/badge/lang-en-lightgrey.svg)](../README.md)
[![fr](https://img.shields.io/badge/lang-fr-lightgrey.svg)](README.fr.md)
[![de](https://img.shields.io/badge/lang-de-43a047.svg)](README.de.md)
[![nl](https://img.shields.io/badge/lang-nl-lightgrey.svg)](README.nl.md)

Die CRM-Backend-API von [OptimCE](https://www.optimce.be/de/), einer
Open-Source-Plattform für die Verwaltung von Erneuerbare-Energie-Gemeinschaften
im belgischen Energy-Sharing-Kontext. Dieser Dienst stellt die zentrale
CRM-Domäne — Mitglieder, Gemeinschaften, Zähler, Verteilungsschlüssel,
Sharing-Vorgänge, Dokumente, Einladungen, Benachrichtigungen und ein
Audit-Log — als eine in TypeScript geschriebene REST-API bereit. Er liegt hinter
dem API-Gateway der Plattform und vertraut auf die dort durchgeführte
Keycloak-Authentifizierung.

## Teil der OptimCE-Plattform

Dieses Repository ist einer der Dienste der OptimCE-Plattform. Es ist als
Git-Submodul in das Entwicklungs-Monorepo
[OptimCE/monorepo](https://github.com/OptimCE/monorepo) eingebunden, das die
Docker-Compose-Umgebung (Datenbank, API-Gateway, Keycloak, Objektspeicher und
die übrigen Dienste) bereitstellt, um die gesamte Plattform lokal auszuführen.
Wenn Sie dieses Backend zusammen mit dem restlichen Stack ausführen möchten,
beginnen Sie beim Monorepo. Dieses README behandelt die eigenständige Arbeit am
Backend.

## Technologie-Stack

- **Runtime**: Node.js 20.x, TypeScript, [Express 5](https://expressjs.com/)
- **Persistenz**: PostgreSQL über [TypeORM](https://typeorm.io/) und `pg`
- **Dependency Injection**: [Inversify](https://inversify.io/)
- **Authentifizierung**: vom Gateway bereitgestellte Identität + [Keycloak-Admin-Client](https://www.npmjs.com/package/@keycloak/keycloak-admin-client)
- **Objektspeicher**: AWS-S3-SDK (MinIO-kompatibel)
- **Internationalisierung**: [i18next](https://www.i18next.com/)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/) + [Pino](https://getpino.io/)
- **Werkzeuge**: Jest, ESLint, Prettier, Husky, `sqlfluff`

## Erste Schritte

### Voraussetzungen

- Node.js 20.x (empfohlen) oder 18+
- npm (oder `pnpm`/`yarn`, falls bevorzugt)
- Docker & Docker Compose (bei Ausführung über Container)

Es wird empfohlen, einen Node-Versionsmanager zu verwenden (z. B. `fnm` oder
`nvm`):

```bash
# nvm installieren (falls nötig) /!\ Windows: siehe https://fnm.vercel.app zur Installation
curl -fsSL https://fnm.vercel.app/install | bash
# dann Node 20 installieren
nvm install 20
nvm use 20
```

### Installation

1. Klonen Sie das Repository:

   ```bash
   git clone https://github.com/OptimCE/crm-backend.git
   cd crm-backend
   ```

2. Installieren Sie die Abhängigkeiten:

   ```bash
   npm install
   ```

3. Konfigurieren Sie die Umgebung. Die umgebungsspezifische Konfiguration liegt
   in `config/`: `development.cjs`, `production.cjs`, `test.cjs`. Sie können vor
   dem Start der Anwendung globale Umgebungsvariablen setzen (z. B. `NODE_ENV`,
   die Datenbankverbindung usw.) — die genaue Liste der erwarteten Variablen
   finden Sie in den Dateien `config/*.cjs`.

## Nützliche Befehle

- Im Entwicklungsmodus starten (Live-Reload über `tsx watch`):

  ```bash
  npm run dev
  ```

- Bauen und Assets kopieren:

  ```bash
  npm run build
  ```

- Die gebaute Version starten:

  ```bash
  npm run start
  ```

- Tests ausführen:

  ```bash
  npm run test
  # Unit-Tests
  npm run test:unit
  # funktionale Tests
  npm run test:functional
  ```

- Linten und formatieren:

  ```bash
  npm run lint
  npm run format
  ```

- Swagger/OpenAPI-Dokumentation erzeugen (Markdown oder HTML):

  ```bash
  npm run swagger:doc:md
  npm run swagger:doc:html
  ```

- TypeDoc-Dokumentation erzeugen:

  ```bash
  npm run typedoc:md
  npm run typedoc:html
  ```

## Ausführung über Docker

### Devcontainer

Wenn Sie eine dieser IDEs verwenden, können Sie einen Devcontainer nutzen, um
schneller eine funktionierende Umgebung zu erhalten:

- Visual Studio Code → https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
- WebStorm → https://www.jetbrains.com/help/webstorm/connect-to-devcontainer.html

Die Datei [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json)
enthält die Konfiguration, mit der Ihre IDE direkt aus dem Container heraus
entwickeln kann.

### Simulierte „Produktions"-Umgebung

Für Integrationstests und eine vollständig simulierte Umgebung nutzen Sie den
Stack des übergeordneten [Monorepos](https://github.com/OptimCE/monorepo). Er
validiert die Integration und baut die Docker-Images bei Bedarf, deckt aber
weder Skalierbarkeit noch Hochverfügbarkeit ab.

## Datenbank

Das SQL-Initialisierungsskript liegt in `database_script/init.sql`. Mit Docker
Compose kann die Datenbank gemäß der Compose-Konfiguration automatisch
initialisiert werden; andernfalls importieren Sie es manuell:

```bash
# Beispiel für psql
psql <datenbank-verbindungszeichenfolge> -f database_script/init.sql
```

### SQL-Linting

Verwenden Sie `sqlfluff`, um SQL-Dateien zu linten:

- `sqlfluff fix database_script/init.sql --dialect postgres` — behebt
  SQL-Linting-Verstöße im Initialisierungsskript
- `sqlfluff fix tests/sql/init.sql --dialect postgres` — behebt
  SQL-Linting-Verstöße im Test-Initialisierungsskript

## Internationalisierung

Die Übersetzungsdateien liegen in `assets/` (`en/`, `fr/`, `de/`, `nl/`).

## Observability

OpenTelemetry ist im Projekt konfiguriert (siehe die `@opentelemetry/*`-
Abhängigkeiten). Variablen wie `OTEL_EXPORTER_OTLP_ENDPOINT` oder
`OTEL_LOGS_EXPORTER` können nach Bedarf gesetzt werden. Sie können die Anwendung
auch mit aktiviertem Tracing/Logging starten:

```bash
npm run trace
```

## Annex-Katalog

`config/annexes-services.json` listet die Annex-Module (algorithm, simulation, news,
billing, …) auf, die Gemeinschaften abonnieren können. `GET /annexes-services`
liefert sie aus, und nur dort erfährt das Frontend, welche Annexe es gibt. Die Datei
ist ins Image eingebaut, jedes Deployment liefert also dieselbe. Jeder Eintrag hat
`feature`, `displayKey`, `descriptionKey`, `icon`, `minRole`, `frontendRoute`,
`subscribePath` und `unsubscribePath`, dazu zwei optionale Felder:

- `unsubscribeWarningKey`: ein zusätzlicher i18n-Satz für den Bestätigungsdialog der
  Abmeldung.
- `defaultEnabled` (Boolean, fehlend = `true`): ob ein Deployment das Modul
  ausliefert, wenn keine der Variablen unten es nennt. Liefern Sie einen neuen Annex,
  dessen Dienst noch nicht überall bereitgestellt ist, mit `"defaultEnabled": false`
  aus. `live-data` wird so ausgeliefert: Der Entwicklungs-Stack des Monorepos schaltet
  es mit `ANNEX_CATALOG_ENABLE=live-data` in `.env.dev` ein, und `config/test.cjs` tut
  dasselbe für die Testsuiten.

Jedes Deployment wählt dann seine eigene Auswahl mit zwei Variablen:

| Variable                | Wirkung                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `ANNEX_CATALOG_ENABLE`  | Kommagetrennte Funktionen, die auszuliefern sind, obwohl ihr Eintrag `"defaultEnabled": false` angibt |
| `ANNEX_CATALOG_DISABLE` | Kommagetrennte Funktionen, die auszublenden sind. Hat Vorrang vor `ANNEX_CATALOG_ENABLE`              |

Ein Eintrag wird ausgeliefert, wenn er nicht in `ANNEX_CATALOG_DISABLE` steht und
entweder sein `defaultEnabled` nicht `false` ist oder er in `ANNEX_CATALOG_ENABLE`
steht. Namen sind exakte `feature`-Werte (Groß-/Kleinschreibung zählt), umgebende
Leerzeichen werden ignoriert, und eine leere Variable bedeutet keine. Ist keine der
beiden Variablen gesetzt, wird jeder Eintrag ausgeliefert, dessen `defaultEnabled`
nicht `false` ist.

- **Nennen Sie nur Funktionen, die im ausgeführten Image enthalten sind.** Ein Name,
  der kein `feature` der Datei ist, verweigert den Start: Ein Tippfehler in
  `ANNEX_CATALOG_DISABLE` ließe den Annex sonst eingeschaltet. Die Protokollzeile hat
  die `operation` `annexes_services:catalog_overrides` und listet die unbekannten
  Namen auf. In der Produktion ist das eine Neustartschleife des Containers; im
  Entwicklungs-Stack (`tsx watch`) läuft der Container weiter, und nur das Protokoll
  zeigt es. Setzen Sie eine Variable also im selben Deployment wie das Image, das den
  Eintrag hinzufügt, entfernen Sie sie in dem Deployment, das den Eintrag entfernt, und
  bedenken Sie, dass ein Rückschritt auf ein älteres Image einen bereits gesetzten
  Namen ungültig machen kann. Um einen noch nicht bereitgestellten Annex
  ausgeschaltet zu lassen, verwenden Sie `"defaultEnabled": false` in der Datei. Setzen
  Sie `ANNEX_CATALOG_DISABLE` nicht im Voraus.
- **Startprotokoll.** Beim Start protokolliert der Dienst einmal, mit der `operation`
  `annexes_services:catalog_loaded`, die Funktionen unter `enabled` und `disabled`.
  Dieses Protokoll, nicht die Datei, sagt Ihnen, was ein Deployment anbietet.
- **Weitergabe.** Eine Variable erreicht den Prozess nur, wenn die Compose-Datei des
  Deployments sie unter `environment:` von crm-backend aufführt
  (`- ANNEX_CATALOG_ENABLE=${ANNEX_CATALOG_ENABLE:-}`, ebenso für `_DISABLE`). Ein
  `.env`-Wert ohne eine solche Zeile wird stillschweigend ignoriert: Das
  Startprotokoll zeigt dann `overrides: { enable: [], disable: [] }`. Die
  `docker-compose.dev.yml` des Monorepos reicht beide weiter; prüfen Sie die
  Compose-Datei jedes anderen Deployments, bevor Sie sich darauf verlassen.
- **Eine Änderung anwenden.** Beide Variablen werden einmal beim Start gelesen. Legen
  Sie den Container neu an (`docker compose up -d crm-backend`, oder
  `./docker-stack.sh restart -s crm-backend` im Monorepo): `docker compose restart`
  behält die alte Umgebung.

**Was das Deaktivieren bewirkt.** Der Annex verschwindet aus `GET /annexes-services`,
das Frontend zeigt also weder Karte noch Navigationslink noch Dashboard-Kachel dafür,
auch nicht für bereits abonnierte Gemeinschaften. Bei news, billing, live-data und
administrative-document schickt der Route-Guard diese Benutzer außerdem zur Startseite
zurück. Die Seiten von algorithm und simulation lassen sich weiterhin über eine direkte
URL öffnen. Ein neues Abonnement erhält `404 FEATURE_NOT_FOUND`, und das Protokoll
nennt `reason: "hidden"`. Die Abmeldung akzeptiert weiterhin jede Funktion der Datei.

**Was das Deaktivieren nicht bewirkt.** Es entzieht bereits abonnierten Gemeinschaften
nichts. Die Annex-Dienste prüfen die Zeile in `community_subscription`, nie diesen
Katalog; sie antworten diesen Gemeinschaften also weiterhin, und live-data erfasst
weiterhin ihre Telemetrie. Um diesen Zugriff zu beenden, nehmen Sie entweder den
Annex-Dienst außer Betrieb oder lassen Sie den ADMIN jeder abonnierten Gemeinschaft
`POST /annexes-services/<feature>/unsubscribe` aufrufen. Die Oberfläche hat dafür keine
Karte, solange der Annex ausgeblendet ist.

## Projektstruktur (Auswahl)

- `src/` — TypeScript-Quellcode (Domänenmodule unter `src/modules/`, gemeinsame
  Infrastruktur unter `src/shared/`)
- `assets/` — i18n-Übersetzungsdateien
- `config/` — umgebungsspezifische Konfigurationsdateien
- `database_script/` — Datenbank-Initialisierungsskripte
- `docs/` — generierte API-Dokumentation (OpenAPI) und übersetzte READMEs
- `tests/` — Unit- und funktionale Testsuiten

## Mitwirken

Beiträge sind willkommen! Bitte lesen Sie die
[Contributing-Richtlinien](../CONTRIBUTING.md) und unseren
[Verhaltenskodex](../CODE_OF_CONDUCT.md) (auf Englisch), bevor Sie ein Issue
oder einen Pull Request eröffnen.

## Sicherheit

Um eine Sicherheitslücke zu melden, folgen Sie bitte der
[Sicherheitsrichtlinie](../SECURITY.md) — eröffnen Sie kein öffentliches Issue.

## Lizenz

Dieses Projekt ist unter der [Apache-Lizenz 2.0](../LICENSE) lizenziert.
