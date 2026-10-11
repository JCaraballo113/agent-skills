// Stands in for gh in the frontier tests. It answers the REST calls the store
// makes from a JSON fixture: the default branch, the viewer's login, and the
// pulls listing filtered by head, base and state, newest first, one page at a
// time, shaped as the store's jq filter shapes it.
import { readFileSync, realpathSync } from "node:fs";

export interface FakeGhPr {
  readonly number: number;
  readonly headRefName: string;
  readonly baseRefName: string;
  readonly state: "OPEN" | "MERGED" | "CLOSED";
  readonly author: string;
  readonly headRefOid: string;
  readonly isCrossRepository: boolean;
}

export interface FakeGhConfig {
  readonly repo: string;
  readonly trunk: string;
  readonly viewer: string;
  readonly prs: readonly FakeGhPr[];
  readonly raw: string | null;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function pulls(config: FakeGhConfig, query: string): string {
  if (config.raw !== null) {
    return config.raw;
  }
  const params = new URLSearchParams(query);
  const head = params.get("head");
  const base = params.get("base");
  const state = params.get("state") ?? "open";
  const size = Number(params.get("per_page") ?? "30");
  const page = Number(params.get("page") ?? "1");
  const rows = config.prs
    .filter(
      (pr) =>
        (head === null || pr.headRefName === head.slice(head.indexOf(":") + 1)) &&
        (base === null || pr.baseRefName === base) &&
        (state === "all" || (state === "open") === (pr.state === "OPEN"))
    )
    .sort((left, right) => right.number - left.number)
    .slice((page - 1) * size, page * size);
  return JSON.stringify(
    rows.map((pr) => ({
      number: pr.number,
      state: pr.state === "OPEN" ? "open" : "closed",
      merged_at: pr.state === "MERGED" ? "2026-01-01T00:00:00Z" : null,
      author: pr.author,
      head: pr.headRefName,
      base: pr.baseRefName,
      sha: pr.headRefOid,
      fork: pr.isCrossRepository,
    }))
  );
}

if (import.meta.main) {
  const [configPath, ...args] = process.argv.slice(2);
  if (configPath === undefined) {
    fail("fake gh needs a config path");
  }
  const config: FakeGhConfig = JSON.parse(readFileSync(configPath, "utf8"));
  if (realpathSync(process.cwd()) !== realpathSync(config.repo)) {
    fail(`gh ran outside the fixture repo: ${realpathSync(process.cwd())}`);
  }
  const command = args.join(" ");
  const pullsPath = "repos/{owner}/{repo}/pulls?";
  const [verb, path, flag] = args;
  if (command === "api repos/{owner}/{repo} --jq .default_branch") {
    process.stdout.write(`${config.trunk}\n`);
  } else if (command === "api user --jq .login") {
    process.stdout.write(`${config.viewer}\n`);
  } else if (
    args.length === 4 &&
    verb === "api" &&
    path?.startsWith(pullsPath) &&
    flag === "--jq"
  ) {
    process.stdout.write(`${pulls(config, path.slice(pullsPath.length))}\n`);
  } else {
    fail(`unexpected gh arguments: ${command}`);
  }
}
