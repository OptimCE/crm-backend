import { execSync } from "child_process";
export default async function (): Promise<void> {
  execSync("docker compose -f tests/utils/docker-compose.test.yml down -v", {
    stdio: "inherit",
  });
}
