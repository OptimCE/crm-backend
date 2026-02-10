import config from "config";
import { container } from "../di-container.js";
import { KeycloakIamService } from "../../shared/iam/implementations/keycloack.iam.service.js";
import type { IIamService } from "../../shared/iam/i-iam.service.js";

/**
 * Initializes the IAM (Identity and Access Management) Service.
 * Reads configuration to determine which IAM provider to use (e.g., KEYCLOAK)
 * and binds the appropriate implementation to the DI container.
 * @throws Error if configuration or settings are missing/invalid.
 */
export function intializeIAMService() {
  console.log("Intialize IAM Service");
  const iam_service: string = config.get("iam_service.name");
  if (iam_service == null) {
    throw new Error("Missing iam_service.name");
  }
  switch (iam_service.toUpperCase()) {
    case "KEYCLOACK": {
      const settings: {
        realm: string;
        realmName: string;
        baseUrl: string;
        clientId: string;
        grantType: string;
        clientSecret: string;
      } = config.get("iam_service.settings");
      if (!settings) {
        throw new Error("Missing settings.");
      }
      if (!settings.realm || !settings.realmName || !settings.baseUrl || !settings.clientId || !settings.grantType || !settings.clientSecret) {
        console.log(`SETTINGS :`);
        console.log(settings);
        throw new Error("Incorrect iam_service.settings");
      }

      container.bind<IIamService>("IAMService").to(KeycloakIamService);
      break;
    }
    default:
      throw new Error("Unknown iam service name");
  }
}
