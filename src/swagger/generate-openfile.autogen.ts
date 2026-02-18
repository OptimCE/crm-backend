import swaggerAutogen from "swagger-autogen";
import path from "path";
import fs from "fs";
import { createGenerator } from "ts-json-schema-generator";
import { MemberParameters, MemberResponses } from "../modules/members/api/member.swagger.js";
import { GlobalErrorResponses, GlobalSchemas, Tags } from "./global.swagger.js";
import { CommunityParameters, CommunityResponses } from "../modules/communities/api/community.swagger.js";
import { DocumentParameters, DocumentResponses } from "../modules/documents/api/document.swagger.js";
import { InvitationParameters, InvitationResponses } from "../modules/invitations/api/invitation.swagger.js";
import { KeyParameters, KeyResponses } from "../modules/keys/api/key.swagger.js";
import { MeterParameters, MeterResponses } from "../modules/meters/api/meter.swagger.js";
import { SharingOperationParameters, SharingOperationResponses } from "../modules/sharing_operations/api/sharing_operation.swagger.js";
import { UserParameters, UserResponses } from "../modules/users/api/user.swagger.js";

const tsConfigPath = path.join(process.cwd(), "tsconfig.json");
const dtoPath = path.join(process.cwd(), "src/**/*.dtos.ts");

const config = {
  path: dtoPath,
  tsconfig: tsConfigPath,
  type: "*",
  skipTypeCheck: true,
  expose: "export",
  jsDoc: "extended",
  topRef: true,
} as const;

console.log("Extracting types from TypeScript...");

let tsSchemas: any = { definitions: {} };
try {
  const generator = createGenerator(config);
  const originalSchemas = generator.createSchema(config.type);

  // 🔥 FIX: Convert JSON Schema refs to OpenAPI refs
  // We stringify, replace the paths, and parse it back.
  const schemaString = JSON.stringify(originalSchemas);
  const fixedSchemaString = schemaString.replace(/#\/definitions\//g, "#/components/schemas/");

  tsSchemas = JSON.parse(fixedSchemaString);
} catch (e) {
  console.warn("Warning: Type generation failed.");
  console.error(e);
}
const outputDir = path.join(process.cwd(), "docs/openapi");
const outputFile = path.join(outputDir, "swagger.yaml");
const endpointsFiles = ["./src/index.routes.ts"];
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const doc = {
  openapi: "3.0.0",
  info: {
    title: "OptimCE CRM Backend API Documentation",
    version: "0.1.0",
    description: "API documentation for the OptimCE CRM access",
  },
  tags: Tags,
  components: {
    securitySchemes: {
      UserIdChecker: {
        type: "string",
        in: "header",
        name: "x-user-id",
        description: "Requires x-user-id header",
      },
      CommunityIdChecker: {
        type: "string",
        in: "header",
        name: "x-community-id",
        description: "Requires x-community-id header",
      },
      MinRoleChecker: {
        type: "string",
        in: "header",
        name: "x-role",
        description: "Requires x-role header",
      },
    },
    parameters: {
      ...CommunityParameters,
      ...DocumentParameters,
      ...InvitationParameters,
      ...KeyParameters,
      ...MemberParameters,
      ...MeterParameters,
      ...SharingOperationParameters,
      ...UserParameters,
    },

    // 3. MERGE RESPONSES
    responses: {
      ...GlobalErrorResponses,
      ...CommunityResponses,
      ...DocumentResponses,
      ...InvitationResponses,
      ...KeyResponses,
      ...MemberResponses,
      ...MeterResponses,
      ...SharingOperationResponses,
      ...UserResponses,
      // ...GenericGlobalResponses
    },

    schemas: {
      ...GlobalSchemas,
      ...tsSchemas.definitions,
    },
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
};

// 5. Generate
const generate = swaggerAutogen();
console.log(`Generating Swagger to: ${outputFile}`);

generate(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger documentation generated successfully!");
});
