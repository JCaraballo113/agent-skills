import { describe, expect, it } from "bun:test";
import { parseReviewThreads } from "./github.ts";
import { pendingCheck, fakeReader } from "./fakes.test-helper.ts";
import { readSnapshot } from "./policy.ts";
import { renderPretty } from "./render.ts";
import { isReviewAutomationCheck, reviewBotFor } from "./review-bots.ts";
import { parsePrNumber } from "./types.ts";

interface ThreadFixture {
  readonly id: string;
  readonly login: string | null;
  readonly body: string;
  readonly reviewId?: string | null;
  readonly isResolved?: boolean;
}

function response(threads: readonly ThreadFixture[]) {
  return {
    data: {
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: threads.map((thread) => ({
              id: thread.id,
              isResolved: thread.isResolved ?? false,
              comments: {
                nodes: [
                  {
                    body: thread.body,
                    createdAt: "now",
                    path: "a.ts",
                    line: 1,
                    author:
                      thread.login === null ? null : { login: thread.login },
                    ...(thread.reviewId === undefined
                      ? {}
                      : {
                          pullRequestReview:
                            thread.reviewId === null
                              ? null
                              : { id: thread.reviewId },
                        }),
                  },
                ],
              },
            })),
          },
        },
      },
    },
  };
}

const comment = (authorLogin: string | null, body = "finding") => ({
  authorLogin,
  body,
});

describe("review bot detection", () => {
  it("recognizes Claude Code Review by its GraphQL and REST logins", () => {
    expect(reviewBotFor(comment("claude"))?.id).toBe("claude");
    expect(reviewBotFor(comment("claude[bot]"))?.id).toBe("claude");
  });

  it("recognizes CodeRabbit by its GraphQL and REST logins", () => {
    expect(reviewBotFor(comment("coderabbitai"))?.id).toBe("coderabbit");
    expect(reviewBotFor(comment("coderabbitai[bot]"))?.id).toBe("coderabbit");
  });

  it("recognizes Bugbot by login or by a cursor comment with a marker", () => {
    expect(reviewBotFor(comment("bugbot"))?.id).toBe("bugbot");
    expect(reviewBotFor(comment("cursor[bot]", "Severity: high"))?.id).toBe(
      "bugbot"
    );
    expect(reviewBotFor(comment("cursor", "RUN_ID: x bugbot"))?.id).toBe(
      "bugbot"
    );
  });

  it("ignores humans, ghost authors, and cursor comments without a marker", () => {
    expect(reviewBotFor(comment("octocat"))).toBeNull();
    expect(reviewBotFor(comment("claude-fan"))).toBeNull();
    expect(reviewBotFor(comment(null))).toBeNull();
    expect(reviewBotFor(comment("cursor", "Opened a follow-up PR"))).toBeNull();
    expect(reviewBotFor(null)).toBeNull();
  });
});

describe("review bot threads", () => {
  it("counts passes per bot from review ids and gives humans zero", () => {
    const threads = parseReviewThreads(
      response([
        { id: "c1", login: "claude", body: "bug", reviewId: "R1" },
        { id: "c2", login: "claude", body: "bug", reviewId: "R2" },
        { id: "c3", login: "claude", body: "bug", reviewId: "R2" },
        {
          id: "r1",
          login: "coderabbitai",
          body: "nit",
          reviewId: "R3",
          isResolved: true,
        },
        { id: "r2", login: "coderabbitai", body: "nit", reviewId: "R4" },
        { id: "b1", login: "cursor", body: "RUN_ID: run-1 severity low" },
        { id: "h1", login: "octocat", body: "why?", reviewId: "R5" },
      ])
    );
    expect(
      threads.map((thread) => [
        thread.id,
        thread.reviewBot,
        thread.reviewBotPasses,
      ])
    ).toEqual([
      ["c1", "claude", 2],
      ["c2", "claude", 2],
      ["c3", "claude", 2],
      ["r2", "coderabbit", 2],
      ["b1", "bugbot", 1],
      ["h1", null, 0],
    ]);
  });

  it("counts a keyless bot thread outside any review as one pass", () => {
    const threads = parseReviewThreads(
      response([
        { id: "c1", login: "claude", body: "bug", reviewId: null },
        { id: "c2", login: "claude", body: "bug" },
      ])
    );
    expect(threads.map((thread) => thread.reviewBotPasses)).toEqual([1, 1]);
    expect(threads.map((thread) => thread.firstComment?.reviewId)).toEqual([
      null,
      null,
    ]);
  });

  it("ignores a keyless Bugbot review once any Bugbot thread has a run id", () => {
    const threads = parseReviewThreads(
      response([
        {
          id: "b1",
          login: "cursor",
          body: "RUN_ID: run-1 severity low",
          reviewId: "R1",
        },
        { id: "b2", login: "cursor", body: "severity high", reviewId: "R2" },
      ])
    );
    expect(threads.map((thread) => thread.reviewBotPasses)).toEqual([1, 1]);
  });

  it("renders the bot and its passes on each pretty thread line", () => {
    const threads = parseReviewThreads(
      response([
        { id: "c1", login: "claude", body: "bug", reviewId: "R1" },
        { id: "h1", login: "octocat", body: "why?" },
      ])
    );
    const thread = threads[0];
    const human = threads[1];
    if (thread === undefined || human === undefined)
      throw new Error("expected two threads");
    const context = { owner: "o", repo: "r", number: parsePrNumber(7) };
    const text = renderPretty({
      schemaVersion: 1,
      sequence: 1,
      observedAt: "now",
      mode: "single",
      kind: "BLOCKER",
      terminal: true,
      exitCode: 3,
      blocker: {
        kind: "review-threads",
        pr: context,
        threads: [thread, human],
      },
    });
    expect(text).toContain(
      "c1 a.ts 1 claude reviewBot=claude reviewBotPasses=1"
    );
    expect(text).toContain(
      "h1 a.ts 1 octocat reviewBot=None reviewBotPasses=0"
    );
  });
});

describe("review automation running", () => {
  it("matches each bot's pending check by name or workflow", () => {
    const check = (name: string, workflow = "") => ({ name, workflow });
    expect(isReviewAutomationCheck(check("CodeRabbit"))).toBe(true);
    expect(isReviewAutomationCheck(check("Claude Code Review"))).toBe(true);
    expect(
      isReviewAutomationCheck(check("claude-review", "Claude Code Review"))
    ).toBe(true);
    expect(isReviewAutomationCheck(check("Bugbot"))).toBe(true);
    expect(isReviewAutomationCheck(check("Agentic Security Review"))).toBe(
      true
    );
    expect(isReviewAutomationCheck(check("build", "CI"))).toBe(false);
    expect(isReviewAutomationCheck(check("Code Review Gate"))).toBe(false);
  });

  it("flags a snapshot whose pending checks include a review bot", async () => {
    const snapshot = await readSnapshot({
      reader: fakeReader({
        fastPath: { kind: "checks", checks: [pendingCheck("CodeRabbit")] },
      }),
      context: { owner: "o", repo: "r", number: parsePrNumber(7) },
      pendingHistory: "omit",
      allowDraft: false,
    });
    if (snapshot.kind !== "open") throw new Error("expected open snapshot");
    expect(snapshot.reviewAutomationRunning).toBe(true);
  });
});
