// A screenshot of a running web app, as proof a change works: in a PR, an
// agent's report, or a check. It opens the page in Chrome Headless Shell over
// the DevTools protocol (Node 22+, no dependencies), optionally clicks or runs
// script first, waits for it to settle, and saves a PNG.
//
//   node scripts/shot.mjs --url http://localhost:3000/settings --out proof/settings.png
//     [--size 1440x900] [--wait 2000] [--text 'Saved'] [--click '<css selector>' ...] [--eval '<js>' ...]
//
// --click and --eval run in order once the page is up; --text waits until the
// page shows it. The browser: --browser <path>, else CHROME_PATH, else Chrome
// Headless Shell fetched once with `npx @puppeteer/browsers` into .cache/chrome.
// On Linux it needs the libraries in CLOUD-FACTS.md, A headless browser.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const steps = args.flatMap((arg, i) => (arg === "--click" || arg === "--eval" ? [{ kind: arg.slice(2), value: args[i + 1] }] : []));
const url = option("url");
const out = option("out");
if (!url || !out) {
  console.error("Usage: node scripts/shot.mjs --url <page> --out <file.png> [--size 1440x900] [--wait 2000] [--text <text>] [--click <selector> ...] [--eval <js> ...]");
  process.exit(2);
}
const [width, height] = (option("size") ?? "1440x900").split("x").map(Number);
const settle = Number(option("wait") ?? 2000);
const text = option("text");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browserPath = () => {
  const given = option("browser") ?? process.env.CHROME_PATH;
  if (given) {
    return given;
  }
  const said = execFileSync("npx", ["-y", "@puppeteer/browsers", "install", "chrome-headless-shell@stable", "--path", path.resolve(".cache/chrome")], { encoding: "utf8" });
  return said.trim().split("\n").pop().split(" ").slice(1).join(" ");
};
const freePort = () =>
  new Promise((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const port = await freePort();
const browser = spawn(browserPath(), ["--headless", `--remote-debugging-port=${port}`, `--window-size=${width},${height}`, "--hide-scrollbars", "--no-first-run", "--no-sandbox", "--disable-gpu", "about:blank"], { stdio: "ignore" });
const done = (code) => {
  browser.kill();
  process.exit(code);
};

try {
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    target = await fetch(`http://127.0.0.1:${port}/json/list`)
      .then((answer) => answer.json())
      .then((list) => list.find((t) => t.type === "page"))
      .catch(() => undefined);
    if (!target) {
      await sleep(100);
    }
  }
  if (!target) {
    throw new Error("The browser didn't start.");
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let next = 0;
  const waiting = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== undefined) {
      waiting.get(message.id)?.(message);
      waiting.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      waiting.set(id, (message) => (message.error ? reject(new Error(`${method}: ${JSON.stringify(message.error)}`)) : resolve(message.result ?? {})));
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const answer = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (answer.exceptionDetails) {
      throw new Error(`${expression.slice(0, 80)}: ${answer.exceptionDetails.exception?.description ?? answer.exceptionDetails.text}`);
    }
    return answer.result?.value;
  };

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await sleep(1500);
  for (const step of steps) {
    if (step.kind === "click") {
      const clicked = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(step.value)}); if (!el) return false; el.scrollIntoView({ block: "center" }); el.click(); return true; })()`);
      if (!clicked) {
        throw new Error(`Nothing matches ${step.value}.`);
      }
    } else {
      await evaluate(step.value);
    }
    await sleep(600);
  }
  if (text) {
    const until = Date.now() + 20_000;
    while (!String(await evaluate("document.body ? document.body.innerText : ''")).includes(text)) {
      if (Date.now() > until) {
        throw new Error(`The page never showed “${text}”.`);
      }
      await sleep(250);
    }
  }
  await sleep(settle);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(path.resolve(out));
  done(0);
} catch (error) {
  console.error(error.message);
  done(1);
}
