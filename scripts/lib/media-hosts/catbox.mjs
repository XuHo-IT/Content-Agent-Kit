// catbox.mjs — anonymous upload to catbox.moe. TESTING ONLY.
//
// Kept because it needs no account and makes a first end-to-end run possible in seconds.
// It is NOT a place to host anything you have published: uploads are anonymous, there is no
// account to manage them from, and no storage guarantee. Social platforms fetch the file
// from the URL you hand them — sometimes days later, and again on re-encode — so a link that
// disappears is a broken post.
//
// Every use prints a warning. Use r2 or cloudinary for anything real.
//
// ENV: none.
export const id = "catbox";
export const label = "Catbox (testing only)";
export const needs = [];
export const durable = false;
export const verified = true; // this one HAS been exercised end to end

export const missing = () => [];
export const ready = () => true;
export const limitMb = { image: 200, video: 200 };

let warned = false;

export async function upload(bytes, name) {
  if (!warned) {
    warned = true;
    console.warn(
      `[media] ! catbox is anonymous with no storage guarantee — fine for a test, wrong for\n` +
        `[media]   anything you publish. Set MEDIA_HOST=r2 (or cloudinary) before posting.`,
    );
  }
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", new Blob([bytes]), name);
  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(300000),
  });
  const url = (await res.text()).trim();
  if (!/^https?:\/\//.test(url)) throw new Error(`Catbox upload failed: ${url.slice(0, 200)}`);
  return url;
}
