import fs from "fs";
import path from "path";

const dir = "video-templates";
for (const t of fs.readdirSync(dir)) {
  const p = path.join(dir, t);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const sub of ["index.html", "compositions/portrait.html"]) {
    const fp = path.join(p, sub);
    if (fs.existsSync(fp)) {
      let c = fs.readFileSync(fp, "utf8");
      if (c.includes("window.__timelines")) {
        c = c.replace(/window\.__timelines\[["'][a-zA-Z0-9_-]+["']\]\s*=\s*\{/g, 'window.__timelines["main"] = window.__timelines["portrait"] = {');
        fs.writeFileSync(fp, c, "utf8");
      }
    }
  }
}
console.log("Fixed all timeline registrations!");
