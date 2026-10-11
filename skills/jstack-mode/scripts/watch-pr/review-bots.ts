// Every review bot the watcher recognizes lives in this list. Thread
// annotation and the "review automation still running" signal both read it,
// so adding a bot is one entry here.
//
// GitHub's GraphQL API reports an app's login without the "[bot]" suffix the
// REST API shows ("coderabbitai", not "coderabbitai[bot]"). Logins are
// compared with that suffix stripped, so either form matches.
export type ReviewBotId = "claude" | "coderabbit" | "bugbot";

export interface ReviewBot {
  readonly id: ReviewBotId;
  // Exact logins, lowercase, without "[bot]".
  readonly logins: readonly string[];
  // A login containing this text is the bot whatever the body says.
  readonly loginContains?: string;
  // When set, a comment from one of `logins` counts only if its body has one
  // of these tokens. The login also posts comments that are not reviews.
  readonly bodyTokens?: readonly string[];
  // Body markers that name one review pass. A bot without any falls back to
  // the id of the GitHub review a thread belongs to. For a bot with markers, a
  // thread without one has no key, and keyless threads count only when no
  // thread of that bot has a key.
  readonly passKeys: readonly RegExp[];
  // Lowercase fragments of a pending check's name or workflow that mean this
  // bot is still reviewing.
  readonly checkTokens: readonly string[];
}

export const REVIEW_BOTS: readonly ReviewBot[] = [
  {
    // Claude Code Review and the Claude GitHub app post as claude[bot].
    id: "claude",
    logins: ["claude"],
    passKeys: [],
    checkTokens: ["claude code review", "claude-review"],
  },
  {
    id: "coderabbit",
    logins: ["coderabbitai"],
    passKeys: [],
    checkTokens: ["coderabbit"],
  },
  {
    // Bugbot posts as cursor[bot], which also posts comments that are not
    // reviews, so a cursor comment needs a Bugbot marker in its body.
    id: "bugbot",
    logins: ["cursor"],
    loginContains: "bugbot",
    bodyTokens: [
      "bugbot",
      "cursor_automation_id",
      "agentic security review",
      "description start",
      "severity",
    ],
    passKeys: [
      /RUN_ID:\s*([a-zA-Z0-9_.:-]+)/,
      /CURSOR_AUTOMATION_ID:\s*([a-zA-Z0-9_.:-]+)/,
    ],
    checkTokens: ["bugbot"],
  },
];

// Pending checks with these names are review automation that belongs to no
// single bot.
const GENERIC_AUTOMATION_TOKENS = [
  "security review",
  "pr review automation",
  "review automation",
] as const;

export function normalizeLogin(login: string | null): string {
  return (login ?? "").toLowerCase().replace(/\[bot\]$/, "");
}

export function reviewBotFor(
  comment: { readonly authorLogin: string | null; readonly body: string } | null
): ReviewBot | null {
  if (comment === null) return null;
  const login = normalizeLogin(comment.authorLogin);
  if (login === "") return null;
  const body = comment.body.toLowerCase();
  for (const bot of REVIEW_BOTS) {
    if (bot.loginContains !== undefined && login.includes(bot.loginContains))
      return bot;
    if (!bot.logins.includes(login)) continue;
    if (
      bot.bodyTokens === undefined ||
      bot.bodyTokens.some((token) => body.includes(token))
    )
      return bot;
  }
  return null;
}

export function reviewPassKey(
  bot: ReviewBot,
  comment: { readonly body: string; readonly reviewId: string | null }
): string | null {
  for (const pattern of bot.passKeys) {
    const match = pattern.exec(comment.body);
    if (match?.[1]) return match[1];
  }
  return bot.passKeys.length === 0 ? comment.reviewId : null;
}

export function isReviewAutomationCheck(check: {
  readonly name: string;
  readonly workflow: string;
}): boolean {
  const labels = [check.name.toLowerCase(), check.workflow.toLowerCase()];
  const tokens = [
    ...REVIEW_BOTS.flatMap((bot) => bot.checkTokens),
    ...GENERIC_AUTOMATION_TOKENS,
  ];
  return labels.some((label) => tokens.some((token) => label.includes(token)));
}
