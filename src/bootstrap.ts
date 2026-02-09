import fs from "fs";
function resolvePlaceholders(input: any): any {
  if (typeof input === "string") {
    return input.replace(/\$\{(.+?)\}/g, (_, name) => process.env[name] || "");
  } else if (typeof input === "object" && input !== null) {
    Object.keys(input).forEach((key) => {
      input[key] = resolvePlaceholders(input[key]);
    });
  }
  return input;
}

function loadConfigWithEnv(filePath: string): any {
  const configData = fs.readFileSync(filePath, "utf8");
  return resolvePlaceholders(JSON.parse(configData));
}

const NODE_ENV = process.env.NODE_ENV || "development";
let resolvedConfig = null;
if (NODE_ENV === "production") {
  const configPath = "./config/production.json";
  resolvedConfig = loadConfigWithEnv(configPath);
  fs.writeFileSync(configPath, JSON.stringify(resolvedConfig, null, 2));
}
