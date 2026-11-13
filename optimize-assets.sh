// scripts/optimize-assets.mjs
// Shrinks images + videos in /public IN PLACE (same file names).
// Run from the project root:  node scripts/optimize-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");
const PUBLIC = path.resolve("public");

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
let before = 0, after = 0;

for (const file of walk(PUBLIC)) {
  const ext = path.extname(file).toLowerCase();
  const size = fs.statSync(file).size;
  const isAvatar = file.includes(`${path.sep}avatars${path.sep}`);
  const tmp = file + ".tmp";
  let ok = false;

  try {
    if (ext === ".jpg" || ext === ".jpeg") {
      await sharp(file).rotate()
        .resize({ width: isAvatar ? 512 : 1920, height: isAvatar ? 512 : 1920, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true }).toFile(tmp);
      ok = true;
    } else if (ext === ".png") {
      await sharp(file)
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true }).toFile(tmp);
      ok = true;
    } else if (ext === ".mp4") {
      const r = spawnSync(ffmpegPath, [
        "-y", "-loglevel", "error", "-i", file,
        "-vf", "scale='min(1280,iw)':-2,fps=30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-pix_fmt", "yuv420p",
        "-an", "-movflags", "+faststart", "-f", "mp4", tmp,
      ], { stdio: "inherit" });
      ok = r.status === 0;
    }
  } catch (err) {
    console.log("  skipped (error):", path.relative(PUBLIC, file), err.message);
  }

  if (!ok) { fs.rmSync(tmp, { force: true }); continue; }

  const newSize = fs.statSync(tmp).size;
  if (newSize < size) {            // only keep it if it's actually smaller
    fs.renameSync(tmp, file);
    before += size; after += newSize;
    console.log(`${path.relative(PUBLIC, file)}: ${mb(size)} -> ${mb(newSize)}`);
  } else {
    fs.rmSync(tmp, { force: true });
  }
}
console.log(`\nDone. Total: ${mb(before)} -> ${mb(after)}`);
