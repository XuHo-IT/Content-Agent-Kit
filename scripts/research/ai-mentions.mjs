#!/usr/bin/env node
// ai-mentions.mjs — when customers ask an AI assistant, does it name your brand?
//
//   node scripts/research/ai-mentions.mjs --brand "Cà phê Muối Huế" --competitors "Highlands, Phúc Long" \
//        --questions questions.txt                 # one question per line
//   node scripts/research/ai-mentions.mjs --brand "…" --questions q.txt --samples 3 --out brain/ai-mentions.md
//
// Asks each question `--samples` times (answers vary run to run — one sample is an anecdote),
// counts which brands each answer names and which sites it cites, and reports each brand's
// mention rate and share of voice. Aliases with "=": --brand "Muối Huế=muoi hue,muoihue".
//
// The model: any OpenAI-compatible chat endpoint — Ollama on your own machine is free
// (AI_ANSWER_ENDPOINT=http://127.0.0.1:11434/v1, AI_ANSWER_MODEL=qwen2.5:7b), or OpenRouter to
// ask the engines customers actually use (paid). A local model is a PROXY for what ChatGPT says,
// not the same thing — the report names the model so nobody reads it as more.
//
// Idea from NiubiGEO (Apache-2.0) — written fresh. Pairs with geo-audit.mjs (is my page
// quotable?) and skills/geo-optimize. ENV: AI_ANSWER_ENDPOINT, AI_ANSWER_MODEL, AI_ANSWER_API_KEY.
import fs from "node:fs";
import path from "node:path";
import { optionalEnv } from "../lib/env.mjs";
import { shareOfVoice } from "./lib/mentions.mjs";

const parseEntity = (s) => {
  const [name, al] = String(s).split("=");
  return { name: name.trim(), aliases: (al ?? "").split(/[,;]/).map((x) => x.trim()).filter(Boolean) };
};

/** One chat completion from an OpenAI-compatible endpoint. */
export async function askOnce({ endpoint, model, key, question, system }) {
  const r = await fetch(`${endpoint.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model, temperature: 0.7, messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: question }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message ?? JSON.stringify(j).slice(0, 200)}`);
  return String(j.choices?.[0]?.message?.content ?? "");
}

export function report(res, { brand, model, samples, today }) {
  const L = [`# AI có nhắc tới ${brand.name} không? — ${today}`, ""];
  L.push(`Model: **${model}** · ${res.answers} câu trả lời (${samples} lần/câu hỏi). Model chạy máy chỉ là *ước lượng* cho ChatGPT/Gemini/Perplexity, không phải chính chúng.`, "");
  L.push("| Thương hiệu | Được nhắc trong | Thị phần tiếng nói | Được nhắc đầu tiên |", "|---|---|---|---|");
  for (const t of res.table) L.push(`| ${t.name === brand.name ? `**${t.name}**` : t.name} | ${Math.round(t.mentionRate * 100)}% câu trả lời | ${Math.round(t.shareOfVoice * 100)}% | ${t.firstPlace} lần |`);
  L.push("", "## Câu hỏi không nhắc tới bạn", "");
  const missing = [...new Set(res.questions.filter((q) => !q.mentioned.includes(brand.name)).map((q) => q.question))];
  L.push(...(missing.length ? missing.map((q) => `- ${q}`) : ["- (không có — mọi câu hỏi đều nhắc tới bạn ít nhất một lần)"]));
  if (res.domains.length) L.push("", "## Nguồn AI hay trích", "", ...res.domains.map((d) => `- ${d.domain} (${d.count})`));
  L.push("", "> Câu hỏi bị bỏ sót là chỗ cần viết nội dung trả lời trực tiếp — chạy `geo-audit.mjs` trên bài đó trước khi đăng.", "");
  return L.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `ai-mentions.mjs — does an AI assistant name your brand when customers ask?\n` +
        `  --brand "<name>[=alias,alias]"     your brand\n` +
        `  --competitors "<a>, <b>"           brands to compare (aliases with = too, separate brands with |)\n` +
        `  --questions <file>                 one customer question per line\n` +
        `  --samples <n>                      answers per question (default 3)\n` +
        `  --out <file.md>                    also write the report (and a .json beside it)\n` +
        `env: AI_ANSWER_ENDPOINT (OpenAI-compatible, e.g. Ollama http://127.0.0.1:11434/v1), AI_ANSWER_MODEL, AI_ANSWER_API_KEY`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const die = (m) => { console.error(`[mentions] ✗ ${m}`); process.exit(1); };
  const endpoint = optionalEnv("AI_ANSWER_ENDPOINT");
  const model = optionalEnv("AI_ANSWER_MODEL");
  if (!endpoint || !model) die("set AI_ANSWER_ENDPOINT and AI_ANSWER_MODEL in .env — e.g. Ollama: http://127.0.0.1:11434/v1 + qwen2.5:7b");
  if (!flag("--brand")) die("--brand is required");
  const qf = flag("--questions");
  if (!qf || !fs.existsSync(qf)) die("--questions <file> (one question per line) is required");
  const brand = parseEntity(flag("--brand"));
  // brands are separated by "|" when any has aliases (which use commas), else by commas
  const rawComps = String(flag("--competitors", ""));
  const comps = (rawComps.includes("|") ? rawComps.split("|") : rawComps.split(",")).map((s) => s.trim()).filter(Boolean).map(parseEntity);
  const entities = [brand, ...comps];
  const questions = fs.readFileSync(qf, "utf8").split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
  const samples = Math.max(1, Number(flag("--samples", "3")));
  const runs = [];
  for (const q of questions) {
    for (let k = 0; k < samples; k++) {
      try {
        runs.push({ question: q, answer: await askOnce({ endpoint, model, key: optionalEnv("AI_ANSWER_API_KEY"), question: q }) });
        process.stdout.write(".");
      } catch (e) { die(`asking "${q.slice(0, 50)}": ${e.message}`); }
    }
  }
  process.stdout.write("\n");
  const res = shareOfVoice(runs, entities);
  const md = report(res, { brand, model, samples, today: new Date().toISOString().slice(0, 10) });
  console.log(md);
  if (flag("--out")) {
    fs.mkdirSync(path.dirname(path.resolve(flag("--out"))), { recursive: true });
    fs.writeFileSync(flag("--out"), md);
    fs.writeFileSync(flag("--out").replace(/\.md$/, "") + ".json", JSON.stringify({ model, samples, ...res, runs }, null, 2) + "\n");
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
