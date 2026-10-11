import { afterEach, describe, expect, it } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NotFoundError,
  UserError,
  openStore,
  parseVerdict,
  walkStack,
  type StackPullRequest,
  type OpenStoreOptions,
  type Store,
} from "./store.ts";
import type { FakeGhConfig, FakeGhPr } from "./fake-gh.test-helper.ts";

const SCRIPT = join(import.meta.dir, "orch.ts");
const directories: string[] = [];
const handles: Store[] = [];

interface RunResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function makeDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "orch-test-"));
  directories.push(directory);
  return directory;
}

function useStore(
  directory: string,
  options?: OpenStoreOptions
): Store {
  const store = openStore(directory, options);
  handles.push(store);
  return store;
}

async function initializedStore(): Promise<{
  readonly directory: string;
  readonly store: Store;
}> {
  const directory = await makeDirectory();
  const store = useStore(directory);
  await store.init();
  return { directory, store };
}

function git({
  args,
  repo,
}: {
  args: readonly string[];
  repo: string;
}): string {
  const result = Bun.spawnSync(["git", "-C", repo, ...args]);
  if (result.exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr.toString()}`
    );
  }
  return result.stdout.toString().trim();
}

async function makeGitStack(directory: string): Promise<{
  readonly repo: string;
  readonly mergedSha: string;
  readonly closedSha: string;
  readonly openSha: string;
}> {
  const repo = join(directory, "repo");
  await mkdir(repo);
  git({ repo, args: ["init", "--initial-branch=main"] });
  git({ repo, args: ["config", "user.name", "Orch Test"] });
  git({ repo, args: ["config", "user.email", "orch@example.com"] });
  await writeFile(join(repo, "main.txt"), "main\n");
  git({ repo, args: ["add", "."] });
  git({ repo, args: ["commit", "-m", "main"] });

  const branches = ["stack/merged", "stack/closed", "stack/open"];
  for (const [index, branch] of branches.entries()) {
    git({ repo, args: ["checkout", "-b", branch] });
    await writeFile(join(repo, `stack-${index}.txt`), `${branch}\n`);
    git({ repo, args: ["add", "."] });
    git({ repo, args: ["commit", "-m", branch] });
  }

  return {
    repo,
    mergedSha: git({ repo, args: ["rev-parse", "stack/merged"] }),
    closedSha: git({ repo, args: ["rev-parse", "stack/closed"] }),
    openSha: git({ repo, args: ["rev-parse", "stack/open"] }),
  };
}

type FakePr = Pick<
  FakeGhPr,
  "number" | "headRefName" | "baseRefName" | "state"
> &
  Partial<FakeGhPr>;

const FAKE_REMOTE_SHA = "f".repeat(40);
const FAKE_GH = join(import.meta.dir, "fake-gh.test-helper.ts");

async function withFakeGh<T>({
  directory,
  operation,
  prs = [],
  raw = null,
  trunk = "main",
  viewer = "me",
}: {
  directory: string;
  operation: () => Promise<T>;
  prs?: readonly FakePr[];
  raw?: string | null;
  trunk?: string;
  viewer?: string;
}): Promise<T> {
  const bin = join(directory, "bin");
  await mkdir(bin);
  const config = join(directory, "gh-fixture.json");
  await writeFile(
    config,
    JSON.stringify({
      repo: join(directory, "repo"),
      trunk,
      viewer,
      raw,
      prs: prs.map((pr) => ({
        author: "me",
        headRefOid: FAKE_REMOTE_SHA,
        isCrossRepository: false,
        ...pr,
      })),
    } satisfies FakeGhConfig)
  );
  const gh = join(bin, "gh");
  await writeFile(
    gh,
    `#!/usr/bin/env bash
exec ${JSON.stringify(process.execPath)} ${JSON.stringify(FAKE_GH)} ${JSON.stringify(config)} "$@"
`
  );
  await chmod(gh, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}:${originalPath ?? ""}`;
  try {
    return await operation();
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
  }
}

function runCli(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env
): RunResult {
  const result = Bun.spawnSync([process.execPath, SCRIPT, ...args], { env });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

afterEach(async () => {
  for (const store of handles.splice(0).reverse()) {
    await store.close();
  }
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe("Store", () => {
  it("initializes an idempotent plain-file store and releases its lock", async () => {
    const directory = await makeDirectory();
    const store = useStore(directory);

    expect(await store.init()).toEqual({ store: directory });
    const firstUnits = await readFile(join(directory, "units.tsv"), "utf8");
    const firstLedger = await readFile(
      join(directory, "ledger.tsv"),
      "utf8"
    );

    expect(await store.init()).toEqual({ store: directory });
    expect(await readFile(join(directory, "units.tsv"), "utf8")).toBe(
      firstUnits
    );
    expect(await readFile(join(directory, "ledger.tsv"), "utf8")).toBe(
      firstLedger
    );
    expect((await readdir(directory)).sort()).toEqual([
      ".orch.lock",
      "frontier.json",
      "gates.md",
      "inbox",
      "ledger.tsv",
      "preferences.md",
      "units.tsv",
    ]);

    await store.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("composes unit add, set, get, list, and counts", async () => {
    const { store } = await initializedStore();

    expect(
      await store.units.add({
        id: "u1",
        track: "build",
        brief: "briefs/u1.md",
      })
    ).toMatchObject({ id: "u1", state: "pending" });
    expect(
      await store.units.add({ id: "=SUM(A1)", track: "+build" })
    ).toMatchObject({ id: "'=SUM(A1)", track: "'+build" });

    const updated = await store.units.set({
      id: "u1",
      state: "done",
      branch: "jstack/u1",
      pr: 184530,
      sha: "abc123",
    });
    expect(updated).toEqual({
      id: "u1",
      track: "build",
      state: "done",
      branch: "jstack/u1",
      pr: "184530",
      sha: "abc123",
      brief: "briefs/u1.md",
    });
    expect(await store.units.get("u1")).toEqual(updated);
    expect(
      await store.units.list({ state: "done", track: "build" })
    ).toEqual([updated]);
    expect(await store.units.counts()).toEqual({ done: 1, pending: 1 });
    await expect(
      store.units.add({ id: "u1", track: "build" })
    ).rejects.toThrow("unit u1 already exists");
    await expect(
      store.units.set({ id: "missing", state: "done" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records, replaces, checks, and summarizes typed ledger verdicts", async () => {
    const { store } = await initializedStore();

    try {
      await store.ledger.check({ pr: 184530, sha: "abc123" });
      throw new Error("expected ledger check to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      if (error instanceof NotFoundError) {
        expect(error.output).toEqual({
          compact: "NOT-VERIFIED",
          json: {
            pr: "184530",
            sha: "abc123",
            verdict: "NOT-VERIFIED",
          },
        });
      }
    }
    expect(() => parseVerdict("looks-good")).toThrow("verdict must be");

    const recorded = await store.ledger.record({
      pr: 184530,
      sha: "abc123",
      verdict: "unit-test-verified",
      evidence: "reports/verify.md",
      verifier: "opus",
    });
    expect(await store.ledger.check({ pr: 184530, sha: "abc123" })).toEqual(
      recorded
    );
    expect(await store.ledger.summary()).toEqual({
      "unit-test-verified": 1,
    });

    await store.ledger.record({
      pr: 184530,
      sha: "abc123",
      verdict: "live-ui-verified",
      evidence: "reports/live.md",
    });
    expect(await store.ledger.summary()).toEqual({
      "live-ui-verified": 1,
    });
  });

  it("pushes, peeks, and atomically drains inbox pointers", async () => {
    const { directory, store } = await initializedStore();

    const first = await store.inbox.push({
      agent: "worker-1",
      unit: "u1",
      status: "done",
      report: "reports/u1.md",
    });
    expect(first.pointer).toMatchObject({ unit: "u1", status: "done" });
    expect(first.filename).toEndWith(".tsv");
    await store.inbox.push({
      agent: "worker-2",
      unit: "u2",
      status: "failed",
    });

    expect(await store.inbox.count()).toBe(2);
    expect(await store.inbox.peek()).toHaveLength(2);
    expect(await store.inbox.count()).toBe(2);
    expect(await store.inbox.drain()).toHaveLength(2);
    expect(await store.inbox.count()).toBe(0);
    expect(await readdir(join(directory, "inbox"))).toEqual([]);
    expect(
      (await readdir(directory)).filter((name) =>
        name.startsWith(".inbox-drain-")
      )
    ).toEqual([]);
  });

  it("replaces a stale lock whose holder pid is dead", async () => {
    const { directory } = await initializedStore();
    const exited = Bun.spawn(["true"]);
    await exited.exited;
    await writeFile(join(directory, ".orch.lock"), `${exited.pid}\n`);

    const stale: string[] = [];
    const recovered = useStore(directory, {
      onStaleLock: (holder) => stale.push(holder),
    });
    expect(
      await recovered.units.add({ id: "u1", track: "build" })
    ).toMatchObject({ id: "u1" });
    expect(stale).toEqual([String(exited.pid)]);
    await recovered.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("blocks a writer and steals the pid lock only with force", async () => {
    const { directory, store } = await initializedStore();
    await store.close();
    await writeFile(join(directory, ".orch.lock"), `${process.pid}\n`);

    const blocked = useStore(directory);
    await expect(
      blocked.units.add({ id: "u1", track: "build" })
    ).rejects.toThrow(`store lock held by pid ${process.pid}`);

    const stolen: string[] = [];
    const forced = useStore(directory, {
      force: true,
      onLockStolen: (holder) => stolen.push(holder),
    });
    expect(
      await forced.units.add({ id: "u1", track: "build" })
    ).toMatchObject({ id: "u1" });
    expect(stolen).toEqual([String(process.pid)]);
    await forced.close();
    expect(await readdir(directory)).not.toContain(".orch.lock");
  });

  it("parks gates, stores standing orders, and renders status", async () => {
    const { directory, store } = await initializedStore();
    await store.units.add({ id: "u1", track: "build" });
    expect(
      await store.gates.park({
        id: "release",
        question: "Ship now?",
        options: "ship,wait",
        defaultAnswer: "wait",
      })
    ).toMatchObject({ kind: "open", id: "release" });
    expect(
      await store.standing.add({ line: "Never force push." })
    ).toEqual({ number: 1, line: "Never force push." });

    const first = await store.status.render();
    expect(first.changed).toBe("first render");
    expect(first.summary.openGateIds).toEqual(["release"]);
    expect(await readFile(join(directory, "status.md"), "utf8")).toContain(
      "| release | open | Ship now? |"
    );
    expect((await store.status.render()).changed).toBe("no derived changes");

    expect(
      await store.gates.resolve({ id: "release", answer: "ship" })
    ).toMatchObject({ kind: "resolved", answer: "ship" });
    expect((await store.status.render()).changed).toBe("open gates 1->0");
    expect(await store.gates.list()).toEqual([]);
    expect(await store.standing.show()).toEqual([
      { number: 1, line: "Never force push." },
    ]);
  });

  it("resolves the ordered gh frontier and validates an optional pin", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    const prs: readonly FakePr[] = [
      {
        number: 11,
        headRefName: "stack/open",
        baseRefName: "stack/closed",
        state: "OPEN",
      },
      {
        number: 13,
        headRefName: "stack/closed",
        baseRefName: "stack/merged",
        state: "CLOSED",
      },
      {
        number: 10,
        headRefName: "stack/merged",
        baseRefName: "main",
        state: "MERGED",
      },
      {
        number: 9,
        headRefName: "elsewhere",
        baseRefName: "main",
        state: "OPEN",
      },
      {
        number: 12,
        headRefName: "stack/closed",
        baseRefName: "stack/merged",
        state: "OPEN",
        isCrossRepository: true,
      },
    ];

    await withFakeGh({
      directory,
      prs,
      operation: async () => {
        expect(await store.frontier.set({ repo: stack.repo })).toEqual({
          generation: 1,
          prs: [
            {
              pr: 10,
              branches: "stack/merged",
              sha: stack.mergedSha,
              state: "MERGED",
            },
            {
              pr: 13,
              branches: "stack/closed",
              sha: stack.closedSha,
              state: "CLOSED",
            },
            {
              pr: 11,
              branches: "stack/open",
              sha: stack.openSha,
              state: "OPEN",
            },
          ],
          lowestUnmerged: 11,
        });
        expect(
          (
            await store.frontier.set({
              repo: stack.repo,
              prs: [10, 13, 11],
            })
          ).generation
        ).toBe(2);
        expect((await store.frontier.show()).generation).toBe(2);
        await expect(
          store.frontier.set({
            repo: stack.repo,
            prs: [10, 11, 12],
          })
        ).rejects.toThrow(
          "frontier pin mismatch: missing from gh: 12; extra in gh: 13"
        );
        await expect(
          store.frontier.set({
            repo: stack.repo,
            prs: [13, 10, 11],
          })
        ).rejects.toThrow(
          "frontier pin mismatch: order differs: expected 13,10,11; gh 10,13,11"
        );
        await expect(
          store.frontier.set({
            repo: stack.repo,
            prs: [10, 10],
          })
        ).rejects.toThrow("--prs must not contain duplicates");
      },
    });
  });

  it("falls back to the PR head SHA for a branch missing locally", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    git({ repo: stack.repo, args: ["branch", "-D", "stack/merged"] });
    const prs: readonly FakePr[] = [
      {
        number: 10,
        headRefName: "stack/merged",
        baseRefName: "main",
        state: "MERGED",
      },
      {
        number: 11,
        headRefName: "stack/open",
        baseRefName: "stack/merged",
        state: "OPEN",
      },
    ];

    await withFakeGh({
      directory,
      prs,
      operation: async () => {
        expect((await store.frontier.set({ repo: stack.repo })).prs).toEqual([
          {
            pr: 10,
            branches: "stack/merged",
            sha: FAKE_REMOTE_SHA,
            state: "MERGED",
          },
          { pr: 11, branches: "stack/open", sha: stack.openSha, state: "OPEN" },
        ]);
      },
    });
  });

  it("rejects a checked-out branch with no pull request", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);

    await withFakeGh({
      directory,
      prs: [
        {
          number: 10,
          headRefName: "stack/merged",
          baseRefName: "main",
          state: "MERGED",
        },
      ],
      operation: async () => {
        await expect(store.frontier.set({ repo: stack.repo })).rejects.toThrow(
          "branch stack/open has no pull request"
        );
      },
    });
  });

  it("rejects malformed gh output loudly", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);

    await withFakeGh({
      directory,
      raw: "this is not gh output\n",
      operation: async () => {
        await expect(store.frontier.set({ repo: stack.repo })).rejects.toThrow(
          "gh api pulls output is not valid JSON"
        );
      },
    });
  });

  it("rejects an unknown gh PR state", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    const row = {
      number: 11,
      state: "queued",
      merged_at: null,
      author: "me",
      head: "stack/open",
      base: "main",
      sha: FAKE_REMOTE_SHA,
      fork: false,
    };

    await withFakeGh({
      directory,
      raw: JSON.stringify([row]),
      operation: async () => {
        await expect(store.frontier.set({ repo: stack.repo })).rejects.toThrow(
          "gh api pulls output has an unknown PR state for PR #11: queued"
        );
      },
    });
  });

  it("keeps only the viewer's stacks on the trunk, across pages", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    git({ repo: stack.repo, args: ["checkout", "main"] });
    const others = Array.from({ length: 100 }, (_, index) => ({
      number: 1000 + index,
      headRefName: `others/${index}`,
      baseRefName: "main",
      state: "OPEN" as const,
      author: "someone",
    }));

    await withFakeGh({
      directory,
      prs: [
        ...others,
        {
          number: 10,
          headRefName: "stack/merged",
          baseRefName: "main",
          state: "OPEN",
        },
        {
          number: 11,
          headRefName: "stack/open",
          baseRefName: "stack/merged",
          state: "OPEN",
          author: "someone",
        },
      ],
      operation: async () => {
        expect(
          (await store.frontier.set({ repo: stack.repo })).prs.map(
            (row) => row.pr
          )
        ).toEqual([10, 11]);
      },
    });
  });

  it("finds a stack's base PR however old it is", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);
    const newer = Array.from({ length: 1000 }, (_, index) => ({
      number: 1000 + index,
      headRefName: `newer/${index}`,
      baseRefName: "main",
      state: "MERGED" as const,
    }));

    await withFakeGh({
      directory,
      prs: [
        ...newer,
        {
          number: 10,
          headRefName: "stack/merged",
          baseRefName: "main",
          state: "MERGED",
        },
        {
          number: 5000,
          headRefName: "stack/open",
          baseRefName: "stack/merged",
          state: "OPEN",
        },
      ],
      operation: async () => {
        expect(
          (await store.frontier.set({ repo: stack.repo })).prs.map(
            (row) => row.pr
          )
        ).toEqual([10, 5000]);
      },
    });
  });

  it("rejects a stack whose base branch has no pull request", async () => {
    const { directory, store } = await initializedStore();
    const stack = await makeGitStack(directory);

    await withFakeGh({
      directory,
      prs: [
        {
          number: 11,
          headRefName: "stack/open",
          baseRefName: "stack/closed",
          state: "OPEN",
        },
      ],
      operation: async () => {
        await expect(store.frontier.set({ repo: stack.repo })).rejects.toThrow(
          new UserError(
            "PR #11 is based on stack/closed, which has no pull request; open one for stack/closed, or retarget PR #11 onto main"
          )
        );
      },
    });
  });

  it("rejects malformed TSV, verdict, frontier, and inbox data", async () => {
    const { directory, store } = await initializedStore();

    await writeFile(join(directory, "units.tsv"), "wrong\n");
    await expect(store.units.list()).rejects.toThrow(
      "units.tsv has an invalid header"
    );
    await writeFile(
      join(directory, "units.tsv"),
      "id\ttrack\tstate\tbranch\tpr\tsha\tbrief\nshort\trow\n"
    );
    await expect(store.units.list()).rejects.toThrow(
      "units.tsv has a malformed row"
    );

    await writeFile(
      join(directory, "ledger.tsv"),
      "pr\tsha\tverdict\tevidence\tverifier\tts\n1\tsha\tinvalid\treport\tme\tnow\n"
    );
    await expect(store.ledger.summary()).rejects.toThrow(
      "ledger.tsv has invalid verdict invalid"
    );

    await writeFile(join(directory, "frontier.json"), '{"generation":"1"}\n');
    await expect(store.frontier.show()).rejects.toThrow(
      "frontier.json has an invalid shape"
    );

    await writeFile(join(directory, "inbox", "bad.tsv"), "too\tshort\n");
    await expect(store.inbox.peek()).rejects.toThrow(
      "inbox pointer bad.tsv is malformed"
    );
  });

  it("rejects operations after close", async () => {
    const { store } = await initializedStore();
    await store.close();
    await expect(store.units.list()).rejects.toThrow("store is closed");
    await expect(store.status.render()).rejects.toBeInstanceOf(UserError);
  });
});

describe("orch CLI", () => {
  it("prints commander help and rejects invalid parsing with exit 1", async () => {
    const help = runCli(["--help"]);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain("Commands:");
    expect(help.stdout).toContain("unit");
    expect(help.stdout).toContain("ledger");

    const frontierHelp = runCli(["frontier", "set", "--help"]);
    expect(frontierHelp.code).toBe(0);
    expect(frontierHelp.stdout).toContain("--repo <dir>");
    expect(frontierHelp.stdout).toContain("--prs <n,...>");

    const directory = await makeDirectory();
    const invalid = runCli(["--store", directory, "unit", "add", "u1"]);
    expect(invalid.code).toBe(1);
    expect(invalid.stderr).toContain("required option '--track <track>'");
  });

  it("accepts ORCH_STORE and emits complete JSON", async () => {
    const directory = await makeDirectory();
    const env = { ...process.env, ORCH_STORE: directory };
    expect(runCli(["init"], env).code).toBe(0);

    const added = runCli(
      ["unit", "add", "u1", "--track", "build", "--json"],
      env
    );
    expect(added.code).toBe(0);
    expect(JSON.parse(added.stdout)).toEqual({
      id: "u1",
      track: "build",
      state: "pending",
      branch: "",
      pr: "",
      sha: "",
      brief: "",
    });
  });

  it("maps user and not-found outcomes to the preserved exit codes", async () => {
    const directory = await makeDirectory();
    expect(runCli(["--store", directory, "init"]).code).toBe(0);

    const missingRepo = runCli([
      "--store",
      directory,
      "frontier",
      "set",
    ]);
    expect(missingRepo.code).toBe(1);
    expect(missingRepo.stderr).toContain(
      "set --repo <dir> or ORCH_REPO"
    );

    const userError = runCli([
      "--store",
      directory,
      "unit",
      "add",
      "",
      "--track",
      "build",
    ]);
    expect(userError.code).toBe(1);
    expect(userError.stderr).toContain("unit id must not be empty");

    const missingUnit = runCli([
      "--store",
      directory,
      "unit",
      "get",
      "missing",
    ]);
    expect(missingUnit.code).toBe(2);
    expect(missingUnit.stderr).toContain("unit missing not found");

    const missingLedger = runCli([
      "--store",
      directory,
      "--json",
      "ledger",
      "check",
      "184530",
      "abc123",
    ]);
    expect(missingLedger.code).toBe(2);
    expect(JSON.parse(missingLedger.stdout)).toEqual({
      pr: "184530",
      sha: "abc123",
      verdict: "NOT-VERIFIED",
    });
    expect(missingLedger.stderr).toBe("");
  });
});

describe("gh stack walk", () => {
  const row = (
    pr: number,
    headRefName: string,
    baseRefName: string,
    state: StackPullRequest["state"] = "OPEN",
    author = "me"
  ): StackPullRequest => ({
    pr,
    headRefName,
    baseRefName,
    state,
    headRefOid: FAKE_REMOTE_SHA,
    author,
  });
  const walk = (branch: string, rows: readonly StackPullRequest[]) =>
    walkStack({
      branch,
      trunk: "main",
      viewer: () => "me",
      withHead: (head) => rows.filter((pr) => pr.headRefName === head),
      openWithBase: (base) =>
        rows.filter((pr) => pr.baseRefName === base && pr.state === "OPEN"),
    }).map((entry) => entry.pr);

  it("walks down to the trunk and up through the checked-out branch's descendants", () => {
    const rows = [
      row(3, "c", "b"),
      row(1, "a", "main", "MERGED"),
      row(2, "b", "a"),
      row(5, "d2", "c"),
      row(4, "d1", "c"),
      row(6, "e", "d1"),
      row(7, "other", "main"),
    ];
    expect(walk("b", rows)).toEqual([1, 2, 3, 4, 6, 5]);
    expect(walk("e", rows)).toEqual([1, 2, 3, 4, 6]);
  });

  it("walks every open stack when the trunk is checked out", () => {
    expect(
      walk("main", [
        row(2, "b", "a"),
        row(1, "a", "main"),
        row(3, "x", "main"),
        row(4, "old", "main", "MERGED"),
        row(5, "gone", "main", "CLOSED"),
        row(6, "y", "gone"),
      ])
    ).toEqual([1, 2, 3]);
  });

  it("walks only the viewer's stacks from the trunk", () => {
    expect(
      walk("main", [
        row(1, "a", "main"),
        row(2, "b", "a", "OPEN", "someone"),
        row(3, "x", "main", "OPEN", "someone"),
        row(4, "y", "x"),
      ])
    ).toEqual([1, 2]);
  });

  it("rejects a base branch that has no pull request", () => {
    expect(() =>
      walk("c", [row(3, "c", "b"), row(1, "a", "main", "MERGED")])
    ).toThrow(
      new UserError(
        "PR #3 is based on b, which has no pull request; open one for b, or retarget PR #3 onto main"
      )
    );
  });

  it("keeps every state below the branch and only open PRs above it", () => {
    expect(
      walk("b", [
        row(1, "a", "main", "MERGED"),
        row(2, "b", "a"),
        row(3, "c", "b", "CLOSED"),
        row(4, "d", "c"),
        row(5, "e", "b", "MERGED"),
        row(6, "f", "b"),
      ])
    ).toEqual([1, 2, 6]);
  });

  it("stops at the trunk even when a PR's head is the trunk", () => {
    expect(walk("a", [row(1, "a", "main"), row(9, "main", "release")])).toEqual(
      [1]
    );
  });

  it("prefers a branch's open PR, then merged, then the newest closed", () => {
    expect(
      walk("a", [
        row(1, "a", "main", "CLOSED"),
        row(4, "a", "main"),
        row(2, "a", "main", "MERGED"),
      ])
    ).toEqual([4]);
    expect(
      walk("a", [
        row(1, "a", "main", "CLOSED"),
        row(3, "a", "main", "CLOSED"),
        row(2, "a", "main", "MERGED"),
      ])
    ).toEqual([2]);
    expect(
      walk("a", [row(1, "a", "main", "CLOSED"), row(3, "a", "main", "CLOSED")])
    ).toEqual([3]);
  });

  it("survives a base cycle", () => {
    expect(walk("a", [row(1, "a", "b"), row(2, "b", "a")])).toEqual([2, 1]);
  });
});
