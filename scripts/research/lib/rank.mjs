// rank.mjs — pure scoring + dedup for the topic radar. No network, no fs, no clock.
//
// Every function here takes `now` as an argument rather than reading it. That is not
// tidiness: a ranking that reads the clock is a ranking whose test starts failing three
// days after it was written, and this is the part most worth testing — the network layer
// either returns items or it does not, but "which story is hottest" is a judgement that
// can be wrong quietly.
//
// The common item shape every source returns (see lib/sources.mjs):
//   { id, title, url, source, publishedAt, engagement: { votes, comments }, snippet, author }

/** Vietnamese + English diacritics off, d-with-stroke folded too. */
export function deaccent(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** ASCII kebab slug, capped — used for radar filenames. */
export function slugify(text, max = 40) {
  return (
    deaccent(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max)
      .replace(/-+$/, "") || "topic"
  );
}

// Words that carry no topic signal in either language. Dropping them is what lets
// "OpenAI ra mắt mô hình mới" and "OpenAI launches a new model" collide on the title key.
const STOPWORDS = new Set([
  "a", "an", "the", "of", "for", "to", "in", "on", "at", "by", "with", "from", "and", "or",
  "is", "are", "was", "were", "be", "as", "it", "its", "this", "that", "new", "how", "why",
  "va", "cua", "cho", "voi", "tu", "den", "la", "mot", "cac", "nhung", "duoc", "da", "se",
  "moi", "vua", "ra", "trong", "tren", "khi", "ve", "co", "khong", "nay", "day",
]);

/** Title reduced to its signal words, in order. */
export function normalizeTitle(title) {
  return deaccent(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 1 && !STOPWORDS.has(w))
    .join(" ");
}

/**
 * host+path, tracking params dropped. Two links to the same article differ only in
 * `?utm_source=`, and a dedup that keys on the raw URL never notices.
 */
export function urlKey(url) {
  try {
    const u = new URL(String(url));
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const p = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${p}`;
  } catch {
    return String(url ?? "").toLowerCase();
  }
}

/** First N signal words. Kept for the seen-ledger, where an exact key is what is wanted. */
export function titleKey(title, words = 6) {
  return normalizeTitle(title).split(" ").slice(0, words).join(" ");
}

/**
 * Do two headlines describe one story?
 *
 * This started as "do the first six signal words match", which is fast and wrong:
 * "OpenAI launches a new coding model" and "OpenAI launches a new coding model today"
 * reduce to a four-word and a five-word key and never meet. Outlets pad headlines with
 * exactly that kind of trailing word, so the check missed the case it existed for.
 *
 * Jaccard over the signal-word sets instead. The threshold is 0.7 rather than something
 * looser, and the pair below is why:
 *
 *   "openai releases gpt model" vs "openai releases sora model"  -> 3/5 = 0.6   different
 *   "openai launches coding model today" vs "…coding model"      -> 4/5 = 0.8   the same
 *
 * At 0.6 the first pair merges, and two separate launches become one story. Under-merging
 * costs a duplicate in the shortlist; over-merging silently deletes a story, so the
 * threshold sits on the safe side of that pair.
 */
export function sameStory(a, b, threshold = 0.7, minShared = 3) {
  const A = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const B = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return false;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  // Two-word headlines would otherwise hit 1.0 against anything sharing both words.
  if (shared < Math.min(minShared, Math.min(A.size, B.size))) return false;
  return shared / (A.size + B.size - shared) >= threshold;
}

/**
 * Merge items that are the same story. Two mechanisms, because they catch different things:
 * the URL key catches the same link posted to Reddit and to HN, the title comparison catches
 * two outlets covering one announcement.
 *
 * The merged item keeps the earliest publishedAt (when the story broke, not when the slowest
 * aggregator noticed), the summed engagement, the list of sources that carried it — which is
 * what `crossSource` reads — and `parts`, the untouched originals, which is what lets heat be
 * measured per source rather than against whichever source happened to come first.
 */
export function dedupe(items) {
  const byUrl = new Map();
  const clusters = [];

  const absorb = (cluster, item) => {
    cluster.parts.push(item);
    cluster.sources = [...new Set([...cluster.sources, item.source])];
    if (item.url !== cluster.url) {
      cluster.variants.push({ source: item.source, url: item.url, title: item.title });
    }
    cluster.engagement = {
      votes: (cluster.engagement?.votes ?? 0) + (item.engagement?.votes ?? 0),
      comments: (cluster.engagement?.comments ?? 0) + (item.engagement?.comments ?? 0),
    };
    if (item.publishedAt && (!cluster.publishedAt || item.publishedAt < cluster.publishedAt)) {
      cluster.publishedAt = item.publishedAt;
    }
    // Prefer the longest snippet — the aggregators truncate at different lengths.
    if ((item.snippet?.length ?? 0) > (cluster.snippet?.length ?? 0)) cluster.snippet = item.snippet;
  };

  for (const item of items) {
    const uk = urlKey(item.url);
    const byLink = byUrl.get(uk);
    if (byLink) {
      absorb(byLink, item);
      continue;
    }
    // O(n²) on titles, but n is a few hundred at most and an index cannot express
    // "similar enough" — a prefix key is exactly the shortcut that was wrong before.
    const byTitle = clusters.find((c) => c.sources.length < 6 && sameStory(c.title, item.title));
    if (byTitle) {
      absorb(byTitle, item);
      byUrl.set(uk, byTitle);
      continue;
    }
    const fresh = { ...item, sources: [item.source], variants: [], parts: [item] };
    clusters.push(fresh);
    byUrl.set(uk, fresh);
  }

  return clusters;
}

/** Effort-weighted engagement. A comment costs more than a vote, so it counts for more. */
export function engagementValue(item) {
  const e = item.engagement ?? {};
  return (Number(e.votes) || 0) + 2 * (Number(e.comments) || 0);
}

/**
 * Heat = where this item sits among its OWN source's items, 0.1–1.
 *
 * Percentile rather than "value ÷ max" because the scales are not comparable and not even
 * self-comparable: 10k upvotes on Reddit, 10k stars on GitHub and 10k points on HN mean
 * three different things, and one runaway post would flatten every other item in its
 * source to near zero under a max-normalisation.
 */
export function heatByPercentile(items) {
  const bySource = new Map();
  for (const it of items) {
    const s = it.source ?? (it.sources?.[0] ?? "unknown");
    if (!bySource.has(s)) bySource.set(s, []);
    bySource.get(s).push(it);
  }

  const heat = new Map();
  for (const [, group] of bySource) {
    const values = group.map(engagementValue).sort((a, b) => a - b);
    // A source that carries no engagement numbers at all (an RSS wire has none) would
    // otherwise land every item on the 0.1 floor and be permanently outranked by any
    // source that does. No signal is not the same as the lowest signal, so it gets a
    // neutral heat and differentiates on freshness and cross-source instead.
    const flat = values[0] === values[values.length - 1];
    for (const it of group) {
      if (flat) {
        heat.set(it, 0.55);
        continue;
      }
      const v = engagementValue(it);
      const below = values.filter((x) => x < v).length;
      const pct = below / (values.length - 1);
      heat.set(it, 0.1 + 0.9 * pct);
    }
  }
  return heat;
}

/** Exponential decay on age. 1 at publication, 0.5 at `halfLifeDays`. */
export function freshness(publishedAt, now, halfLifeDays = 3) {
  if (!publishedAt) return 0.35; // undated: neither fresh nor dismissed
  const ageDays = (now - new Date(publishedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays)) return 0.35;
  if (ageDays < 0) return 1; // clock skew on a source; do not reward it either
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/**
 * score = heat × freshness × crossSource
 *
 * Takes the RAW items and dedups internally, which is not an ergonomic choice but a
 * correctness one. Heat is a percentile within a source, so it can only be measured before
 * the merge: afterwards a story carried by Reddit and HN has one summed engagement number
 * and one arbitrary `source` field — whichever part happened to arrive first — and it gets
 * percentile-ranked inside that group against items it never competed with. A cross-source
 * story would land at the BOTTOM of Reddit while being top of Hacker News.
 *
 * So each part is scored in its own source, and the merged story takes the best percentile
 * it achieved anywhere. "How well did this do where it did best" is the honest reading.
 *
 * crossSource is then the strongest single signal that something is genuinely happening
 * rather than one community being loud: a story Reddit AND Hacker News AND the wire all
 * carry is a different kind of event from a 3k-upvote thread nobody outside that subreddit
 * saw. It is a multiplier, not an override — a story ten times louder still wins.
 */
export function rank(rawItems, { now, halfLifeDays = 3, crossSourceBonus = 0.5 } = {}) {
  const heat = heatByPercentile(rawItems);
  return dedupe(rawItems)
    .map((it) => {
      const parts = it.parts ?? [it];
      const h = Math.max(...parts.map((p) => heat.get(p) ?? 0.1));
      const f = freshness(it.publishedAt, now, halfLifeDays);
      const nSources = it.sources?.length ?? 1;
      const x = 1 + crossSourceBonus * (nSources - 1);
      // `parts` is working state, not output — it would double the size of every radar file.
      const { parts: _drop, ...rest } = it;
      return {
        ...rest,
        score: Number((h * f * x).toFixed(4)),
        heat: Number(h.toFixed(3)),
        freshness: Number(f.toFixed(3)),
        crossSource: x,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Keys a seen-ledger stores, so tomorrow's run on the same topic can skip this story. */
export function seenKeys(item) {
  const keys = [`u:${urlKey(item.url)}`, `t:${titleKey(item.title)}`];
  for (const v of item.variants ?? []) keys.push(`u:${urlKey(v.url)}`);
  return [...new Set(keys)];
}

/** Drop anything whose url OR title was already used. */
export function dropSeen(items, seen) {
  const set = seen instanceof Set ? seen : new Set(seen ?? []);
  return items.filter((it) => !seenKeys(it).some((k) => set.has(k)));
}
