// proc.mjs — spawn helpers + a tiny concurrency limiter.
// Replaces upstream's `p-limit` dependency; keeps this kit dependency-free.
import { spawn } from "node:child_process";

/** Run a command, buffer its output, resolve stdout. Rejects with trimmed stderr. */
export function run(cmd, args, { trimErr = 800 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) =>
      code === 0
        ? resolve(out)
        : reject(new Error(`${cmd} failed (exit ${code}): ${trimErr ? err.slice(-trimErr) : err}`)),
    );
    proc.on("error", (e) =>
      reject(
        e.code === "ENOENT"
          ? new Error(`${cmd} not found on PATH. Install it and retry.`)
          : e,
      ),
    );
  });
}

/** Run a command streaming straight to this process's stdio (for long renders). */
export function runInherit(cmd, args, { shell = false } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"], shell });
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} failed (exit ${code})`)),
    );
    proc.on("error", reject);
  });
}

/** Is `cmd` callable? Used by preflight, never to gate correctness. */
export async function commandExists(cmd, versionFlag = "-version") {
  try {
    await run(cmd, [versionFlag]);
    return true;
  } catch {
    return false;
  }
}

/** Minimal p-limit: returns fn(task) that queues beyond `n` concurrent tasks. */
export function pLimit(n) {
  const max = Math.max(1, n | 0);
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const { task, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };
  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}
