import { execSync } from "node:child_process";

export default async function () {
  execSync("docker compose -f tests/utils/docker-compose.test.yml down -v", {
    stdio: "inherit",
  });
}
