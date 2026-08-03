// remotion.mjs — render a script.json with Remotion instead of HTML templates.
//
// Remotion is React compiled to MP4. It reaches motion design that CSS keyframes do not:
// spring physics, per-frame interpolation, audio-reactive visuals, real sequencing.
//
// It is also an npm project with React, a bundler and a headless renderer. This kit is
// dependency-free on purpose, so it does NOT pull that in. It scaffolds a Remotion project
// beside your script, converts the script.json into components, and hands you the two
// commands to run. The dependency lives in that folder, not in this repo.
//
// The trade, plainly: an extra install step and a second project to maintain, in exchange
// for motion the HTML backend cannot do. If you are not reaching for that motion, the html
// backend is faster to run and has nothing to install.
//
// ENV: REMOTION_PROJECT_DIR (default: <script dir>/remotion).
import fs from "node:fs";
import path from "node:path";

const FPS = 30;
const WORDS_PER_SEC = 2.5; // same read speed validate.mjs estimates with

const ident = (id) => "Scene" + String(id).replace(/[^A-Za-z0-9]/g, "_");

/** Frames a scene should occupy, from its narration length. Exported for testing. */
export function sceneFrames(scene, fps = FPS) {
  const words = String(scene.voiceText ?? "").split(/\s+/).filter(Boolean).length;
  const sec = scene.durationSec ?? Math.max(words / WORDS_PER_SEC, 1);
  return Math.max(Math.round(sec * fps), fps); // never shorter than a second
}

/**
 * The React source for one scene. Deliberately plain: no animation library, no design
 * opinions. It is a starting point to edit, not a template to use as-is — the point of
 * choosing Remotion is that you want to write the motion yourself.
 */
function sceneComponent(scene) {
  const name = ident(scene.id);
  const title = JSON.stringify(scene.inputs?.headline ?? scene.inputs?.hero ?? String(scene.id));
  const body = JSON.stringify(scene.voiceText ?? "");
  return `// ${name} — generated from scene "${scene.id}". Edit freely; regenerating overwrites it.
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const ${name} = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0b0f', justifyContent: 'center', padding: 80}}>
      <div style={{opacity: enter, transform: \`translateY(\${(1 - enter) * 24}px)\`}}>
        <h1 style={{color: 'white', fontSize: 72, lineHeight: 1.05, margin: 0}}>{${title}}</h1>
        <p style={{color: '#9ca3af', fontSize: 30, marginTop: 28}}>{${body}}</p>
      </div>
    </AbsoluteFill>
  );
};
`;
}

function rootComponent(script) {
  const scenes = script.scenes ?? [];
  const imports = scenes.map((s) => `import {${ident(s.id)}} from './${ident(s.id)}';`).join("\n");
  const seq = scenes
    .map((s) => {
      const frames = sceneFrames(s);
      return `      <Sequence durationInFrames={${frames}}>\n        <${ident(s.id)} />\n      </Sequence>`;
    })
    .join("\n");
  const total = scenes.reduce((n, s) => n + sceneFrames(s), 0) || FPS;
  const [w, h] = (script.aspect ?? "9:16") === "16:9" ? [1920, 1080] : [1080, 1920];

  return `// Generated from script.json by content-agent-kit. Re-running the backend overwrites it.
import {Composition, Sequence, Series} from 'remotion';
${imports}

export const Main = () => (
  <Series>
${seq}
  </Series>
);

export const RemotionRoot = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={${total}}
      fps={${FPS}}
      width={${w}}
      height={${h}}
    />
  </>
);
`;
}

/**
 * Entry point render.mjs calls. Writes the project, then stops and prints the commands —
 * it does not run npm on your behalf. Installing hundreds of packages is a decision the
 * person at the keyboard makes, not a side effect of asking for a render.
 */
export async function render({ script, outputDir, argv = [] }) {
  const projectDir = process.env.REMOTION_PROJECT_DIR
    ? path.resolve(process.env.REMOTION_PROJECT_DIR)
    : path.join(outputDir, "remotion");
  const srcDir = path.join(projectDir, "src");
  const scenes = script.scenes ?? [];

  if (!scenes.length) throw new Error("script.json has no scenes to convert.");

  const files = {
    "src/Root.tsx": rootComponent(script),
    "src/index.ts": `import {registerRoot} from 'remotion';\nimport {RemotionRoot} from './Root';\nregisterRoot(RemotionRoot);\n`,
    "remotion.config.ts": `import {Config} from '@remotion/cli/config';\nConfig.setVideoImageFormat('jpeg');\n`,
    "package.json": JSON.stringify(
      {
        name: "remotion-video",
        private: true,
        scripts: { studio: "remotion studio", render: "remotion render Main out/video.mp4" },
        dependencies: { remotion: "^4", react: "^19", "react-dom": "^19" },
        devDependencies: { "@remotion/cli": "^4" },
      },
      null,
      2,
    ) + "\n",
    "README.md":
      `# Remotion project — generated by content-agent-kit\n\n` +
      `Generated from \`${path.basename(outputDir)}/script.json\`. **Regenerating overwrites \`src/\`** —\n` +
      `move anything you want to keep out of that folder first.\n\n` +
      `\`\`\`bash\nnpm install\nnpm run studio     # preview and edit\nnpm run render     # → out/video.mp4\n\`\`\`\n\n` +
      `Narration is not wired in. The kit's html backend already does TTS, SFX and muxing;\n` +
      `render the visuals here, then mux the voice track with ffmpeg — or use the html\n` +
      `backend end to end if you do not need Remotion's motion.\n`,
  };
  for (const s of scenes) files[`src/${ident(s.id)}.tsx`] = sceneComponent(s);

  if (argv.includes("--dry-run")) {
    console.log(`[video] backend: remotion — dry run, would write ${Object.keys(files).length} file(s):`);
    for (const f of Object.keys(files)) console.log(`[video]     ${path.join(projectDir, f)}`);
    return { dryRun: true, projectDir, files: Object.keys(files) };
  }

  for (const [rel, content] of Object.entries(files)) {
    const out = path.join(projectDir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, content, "utf8");
  }

  console.log(`[video] backend: remotion — ${scenes.length} scene(s) → ${srcDir}`);
  console.log(`[video]`);
  console.log(`[video]   cd ${projectDir}`);
  console.log(`[video]   npm install        # React, Remotion, a bundler — NOT installed into the kit`);
  console.log(`[video]   npm run studio     # preview and edit the scenes`);
  console.log(`[video]   npm run render     # → out/video.mp4`);
  console.log(`[video]`);
  console.log(`[video]   The scene components are a starting point, not a finished design —`);
  console.log(`[video]   writing the motion yourself is the reason to pick this backend.`);
  console.log(`[video]   Narration is not wired in; render visuals here, mux the voice with ffmpeg.`);
  return { projectDir, files: Object.keys(files) };
}

export { FPS, ident, rootComponent, sceneComponent };
