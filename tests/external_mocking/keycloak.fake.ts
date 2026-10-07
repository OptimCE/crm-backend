import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A stand-in for the main HTTP interface of Keycloak 26 (port 8080, served under
 * `--http-relative-path=/keycloak`), for the health check that talks to it.
 *
 * Every answer below was recorded from the dev stack's quay.io/keycloak/keycloak:26.5.5
 * container on 2026-10-06, all `application/json`:
 *  - `GET /keycloak/realms/<realm>/.well-known/openid-configuration` -> 200, a 56-key
 *    discovery document with NO `status` key;
 *  - the same for a realm that does not exist -> 404 `{"error":"Realm does not exist"}`;
 *  - any other path, `/keycloak/health` and `/keycloak/health/ready` included -> 404
 *    `{"error":"Unable to find matching target resource method"}`.
 *
 * Keycloak serves /health only on its management port (9000), and only when
 * KC_HEALTH_ENABLED is set, so nothing on this interface answers it.
 */
export interface FakeKeycloak {
  /** What IAM_BASE_URL holds for this server, relative path included. */
  baseUrl: string;
  /** Realms that exist. Remove one to model a deleted realm or a wrong IAM_REALM. */
  realms: Set<string>;
  /** Request paths received, in order. */
  requests: string[];
  close(): Promise<void>;
}

const RELATIVE_PATH = "/keycloak";
const DISCOVERY = /^\/keycloak\/realms\/([^/]+)\/\.well-known\/openid-configuration$/;

export async function startFakeKeycloak(realms: string[] = ["optimce-realm"]): Promise<FakeKeycloak> {
  const state = { realms: new Set(realms), requests: [] as string[] };

  const server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];
    state.requests.push(path);

    const answer = (status: number, body: unknown): void => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    const discovery = DISCOVERY.exec(path);
    if (req.method === "GET" && discovery) {
      const realm = decodeURIComponent(discovery[1]);
      if (!state.realms.has(realm)) {
        answer(404, { error: "Realm does not exist" });
        return;
      }
      const issuer = `http://${req.headers.host}${RELATIVE_PATH}/realms/${realm}`;
      answer(200, {
        issuer,
        authorization_endpoint: `${issuer}/protocol/openid-connect/auth`,
        token_endpoint: `${issuer}/protocol/openid-connect/token`,
        jwks_uri: `${issuer}/protocol/openid-connect/certs`,
        grant_types_supported: ["authorization_code", "client_credentials", "refresh_token"],
      });
      return;
    }
    answer(404, { error: "Unable to find matching target resource method" });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}${RELATIVE_PATH}`,
    realms: state.realms,
    requests: state.requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
