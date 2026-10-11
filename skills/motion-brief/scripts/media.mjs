import { spawn, spawnSync } from "node:child_process";

export function need(tool) {
  const found = spawnSync(tool, ["-version"], { stdio: "ignore" });
  if (found.error) {
    console.error(`${tool} is not installed. The install command for this OS is in skill.deps.json under "ffmpeg".`);
    process.exit(2);
  }
}

export function rate(text) {
  const [num, den] = String(text).split("/").map(Number);
  return den ? num / den : num;
}

export function probe(file) {
  need("ffprobe");
  const run = spawnSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`ffprobe failed on ${file}: ${run.stderr.trim()}`);
  const info = JSON.parse(run.stdout);
  const video = info.streams.find((s) => s.codec_type === "video");
  const audio = info.streams.filter((s) => s.codec_type === "audio");
  const duration = Number(video?.duration ?? info.format.duration);
  if (!video) return { file, duration, video: null, audioStreams: audio.length };
  const rFps = rate(video.r_frame_rate);
  const avgFps = rate(video.avg_frame_rate);
  return {
    file,
    width: video.width,
    height: video.height,
    fps: avgFps || rFps,
    rFrameRate: video.r_frame_rate,
    avgFrameRate: video.avg_frame_rate,
    variableFrameRate: Boolean(rFps && avgFps && Math.abs(rFps - avgFps) / rFps > 0.01),
    duration,
    frames: video.nb_frames ? Number(video.nb_frames) : Math.round(duration * (avgFps || rFps)),
    codec: video.codec_name,
    audioStreams: audio.length,
  };
}

export function streamChunks(args, chunkBytes, onChunk) {
  need("ffmpeg");
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-v", "error", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let pending = Buffer.alloc(0);
    let index = 0;
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.stdout.on("data", (data) => {
      pending = pending.length ? Buffer.concat([pending, data]) : data;
      while (pending.length >= chunkBytes) {
        onChunk(pending.subarray(0, chunkBytes), index++);
        pending = pending.subarray(chunkBytes);
      }
    });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(index) : reject(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`))));
  });
}

export function ffmpeg(args) {
  need("ffmpeg");
  const run = spawnSync("ffmpeg", ["-v", "info", "-hide_banner", "-nostats", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`ffmpeg failed: ${run.stderr.trim().split("\n").slice(-5).join("\n")}`);
  return run.stderr;
}

export function args(argv, spec) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const [key, inline] = a.slice(2).split("=");
    if (!(key in spec)) throw new Error(`unknown flag --${key}`);
    if (spec[key] === "boolean") out[key] = true;
    else out[key] = inline ?? argv[++i];
  }
  return out;
}

export const seconds = (frame, fps) => (frame / fps).toFixed(2);
