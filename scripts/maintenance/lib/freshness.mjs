// freshness.mjs — the facts in this kit that go stale, and when each was last checked.
//
// WHY. A kit that makes and posts content leans on facts it does not control: what a platform
// accepts, what Vietnamese advertising law allows, which skill changed its licence, whether
// TikTok now requires an "AI-generated" label. Each was true the day it was written. This is
// the list of them, with how long each stays trustworthy, so that whenever someone USES the
// kit the agent can see what has expired and research it before relying on it
// (skills/freshness-check/SKILL.md). Pure; tests in tests/freshness.test.mjs.
//
// Three kinds:
//   code     — the date lives in a source file (a CHECKED constant); updating it means
//              editing that file, with the source cited
//   auto     — a script can check it with no judgement (licences, the template registry)
//   research — news and policy that no file holds; the agent searches, writes a dated digest
//              to brain/policy-news.md, and records the check in state/freshness.json

export const ITEMS = [
  {
    id: "platform-specs",
    kind: "code",
    what: "Upload limits per platform: TikTok, Facebook Reels, YouTube Shorts, Shopee, Zalo (length, size, ratio)",
    file: "scripts/video/lib/delivery-specs.mjs",
    dateRe: /const CHECKED = "(\d{4}-\d{2}-\d{2})"/,
    maxAgeDays: 60,
    queries: [
      "TikTok video upload requirements max length file size {year}",
      "Facebook Reels maximum length specs {year} Meta help",
      "YouTube Shorts length limit support.google.com",
      "Shopee Seller Centre video sản phẩm yêu cầu thời lượng dung lượng {year}",
      "Zalo video đăng tải giới hạn dung lượng thời lượng {year}",
    ],
    official: ["support.google.com/youtube", "seller.shopee.vn", "ads.zalo.me", "support.tiktok.com", "facebook.com/help"],
    update: "Edit PLATFORMS + CHECKED in scripts/video/lib/delivery-specs.mjs; official numbers go in `hard`, disputed ones in `soft`; keep `sources`.",
  },
  {
    id: "vn-ads-law",
    kind: "code",
    what: "Vietnamese advertising and promotion law behind ads-policy-check (Luật Quảng cáo, nghị định khuyến mại, quảng cáo trên mạng)",
    file: "scripts/ads/policy-lint.mjs",
    dateRe: /LEGAL_CHECKED = "(\d{4}-\d{2}-\d{2})"/,
    maxAgeDays: 30,
    queries: [
      "nghị định mới về quảng cáo {year}",
      "nghị định khuyến mại mức giảm giá tối đa {year} văn bản hợp nhất",
      "quy định quảng cáo trên mạng xã hội người có ảnh hưởng KOL {year}",
    ],
    official: ["vbpl.vn", "thuvienphapluat.vn", "chinhphu.vn", "moit.gov.vn", "mic.gov.vn"],
    update: "Edit RULES + LEGAL_CHECKED in scripts/ads/policy-lint.mjs. A rule changes only on the text of the law (vbpl.vn), never on a news article alone; cite it.",
  },
  {
    id: "platform-policy-news",
    kind: "research",
    what: "Platform rule changes that hit creators: monetisation, community guidelines, reach of reposted/unoriginal content, links, live selling",
    maxAgeDays: 7,
    queries: [
      "TikTok creator policy update {month} {year}",
      "Facebook Meta creator monetization policy change {month} {year}",
      "YouTube Shorts policy update {month} {year}",
      "TikTok Shop Việt Nam chính sách mới {month} {year}",
      "Shopee Video chính sách nhà bán {month} {year}",
    ],
    official: ["newsroom.tiktok.com", "about.fb.com/news", "blog.youtube", "creators.facebook.com", "banhang.shopee.vn"],
    update: "Write a dated digest to brain/policy-news.md (what changed, from when, who it affects, source link). If it changes a kit rule, open the file that holds the rule.",
  },
  {
    id: "ai-content-labels",
    kind: "research",
    what: "Rules for labelling AI-generated or AI-edited content — on each platform, and in Vietnamese law",
    maxAgeDays: 30,
    queries: [
      "TikTok AI-generated content label requirement {year}",
      "Meta AI info label policy video {year}",
      "YouTube altered or synthetic content disclosure {year}",
      "Việt Nam quy định gắn nhãn nội dung do AI tạo ra {year}",
    ],
    official: ["support.tiktok.com", "transparency.meta.com", "support.google.com/youtube", "vbpl.vn"],
    update: "Digest to brain/policy-news.md. If a label becomes mandatory for what the kit makes (TTS voice, AI visuals), say so in skills/video-and-post §5 and the review-gate rubric.",
  },
  {
    id: "vn-content-law",
    kind: "research",
    what: "Vietnamese rules for online content and accounts: Nghị định on internet services, account verification, KOL/livestream obligations, copyright",
    maxAgeDays: 30,
    queries: [
      "nghị định quản lý dịch vụ internet thông tin trên mạng mới nhất {year}",
      "quy định người có ảnh hưởng livestream bán hàng {year}",
      "luật sở hữu trí tuệ sửa đổi nội dung số {year}",
    ],
    official: ["vbpl.vn", "chinhphu.vn", "mic.gov.vn", "thuvienphapluat.vn"],
    update: "Digest to brain/policy-news.md; anything that changes what may be posted goes to skills/review-gate.",
  },
  {
    id: "skill-licences",
    kind: "auto",
    what: "Licences of the skills in skills/registry.json (four had drifted by 2026-11)",
    command: "node scripts/maintenance/licence-watch.mjs",
    maxAgeDays: 30,
    update: "Fix skills/registry.json: license, licenseFile, and `restriction` for anything NC / Commons Clause / own terms.",
  },
  {
    id: "template-registry",
    kind: "auto",
    what: "The upstream HyperFrames template registry (new and removed items, documented counts)",
    command: "node scripts/video/registry-watch.mjs",
    maxAgeDays: 30,
    update: "node scripts/video/registry-watch.mjs --write; pick new templates by hand (docs/16).",
  },
  {
    id: "vi-speech-models",
    kind: "research",
    what: "Vietnamese speech models: new TTS voices and ASR (Whisper fine-tunes) worth swapping in, and their licences",
    maxAgeDays: 90,
    queries: ["Vietnamese text to speech open source model {year}", "Vietnamese speech recognition whisper fine-tune {year} license"],
    official: ["github.com", "huggingface.co"],
    update: "Add a candidate to docs/30-de-xuat-tiep-theo.md with its licence (code AND weights). Never switch a default without an A/B listen.",
  },
];

const DAY = 86400000;

/** Days from `iso` to `today` (both YYYY-MM-DD or Date), or null when there is no date. */
export function ageDays(iso, today) {
  if (!iso) return null;
  const a = Date.parse(String(iso).slice(0, 10) + "T00:00:00Z");
  const b = Date.parse((today instanceof Date ? today.toISOString() : String(today)).slice(0, 10) + "T00:00:00Z");
  return Number.isFinite(a) && Number.isFinite(b) ? Math.floor((b - a) / DAY) : null;
}

/** `{year}` / `{month}` in a query → the current ones, so a search asks for THIS year's news. */
export function fillQuery(q, today) {
  const d = today instanceof Date ? today : new Date(String(today).slice(0, 10) + "T00:00:00Z");
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return q.replaceAll("{year}", String(d.getUTCFullYear())).replaceAll("{month}", month);
}

/**
 * Where each item stands. `readFile(path)` returns a file's text (or null); `state` is
 * state/freshness.json ({ id: { checkedAt, note } }) — a later date there wins over the file's,
 * so "checked, nothing changed" can be recorded without touching source.
 * → [{ ...item, checkedAt, age, stale, queries (filled) }], stale first, oldest first.
 */
export function freshness({ today, readFile, state = {}, items = ITEMS }) {
  return items
    .map((it) => {
      let fromFile = null;
      if (it.kind === "code") {
        const m = readFile(it.file)?.match(it.dateRe);
        fromFile = m ? m[1] : null;
      }
      const fromState = state[it.id]?.checkedAt ?? null;
      const checkedAt = [fromFile, fromState].filter(Boolean).sort().at(-1) ?? null;
      const age = ageDays(checkedAt, today);
      return {
        ...it,
        checkedAt,
        age,
        stale: age === null || age > it.maxAgeDays,
        note: state[it.id]?.note ?? null,
        queries: (it.queries ?? []).map((q) => fillQuery(q, today)),
      };
    })
    .sort((a, b) => Number(b.stale) - Number(a.stale) || (b.age ?? 1e9) - (a.age ?? 1e9));
}

/** state/freshness.json after recording that `id` was checked `today`. */
export function markChecked(state, id, today, note = "") {
  if (!ITEMS.some((i) => i.id === id)) throw new Error(`unknown item "${id}" — one of ${ITEMS.map((i) => i.id).join(", ")}`);
  const d = (today instanceof Date ? today.toISOString() : String(today)).slice(0, 10);
  return { ...state, [id]: { checkedAt: d, ...(note ? { note } : {}) } };
}
