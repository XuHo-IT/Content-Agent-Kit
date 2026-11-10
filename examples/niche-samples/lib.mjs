// lib.mjs — shared pieces of the niche sample scripts (niches-1.mjs, niches-2.mjs).
export const CH = "Kênh Mẫu";

export const base = (title, theme) => ({
  version: "1.0",
  renderer: "hyperframes",
  aspect: "9:16",
  theme,
  metadata: { title, source: { url: "https://example.com", domain: "example.com", image: null }, channel: CH },
  voice: { provider: "omnivoice", speed: 1 },
});

export const outro = (voiceText, cta, templateId = "frame-statement-outro") => ({
  id: "outro",
  type: "outro",
  voiceText,
  templateId,
  inputs: { cta, channel: CH, source: "" },
});
