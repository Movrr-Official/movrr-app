import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
const out = new URL("../public/pwa/partner/", import.meta.url);
await mkdir(out, { recursive: true });
// Approved Rider Android artwork copied without changing the Rider repository.
// Keep its full canvas and optical scale; recolour the white mark, not its shape.
const source = new URL("../assets/partner/android-icon-source.png", import.meta.url);
const { data, info } = await sharp(fileURLToPath(source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const green = [35, 178, 69], background = "#123c2c";
for (let i = 0; i < data.length; i += 4) {
  const coverage = Math.max(0, Math.min(1, (data[i] - green[0]) / (255 - green[0])));
  data[i] = green[0]; data[i + 1] = green[1]; data[i + 2] = green[2];
  data[i + 3] = Math.round(coverage * 255);
}
const mark = await sharp(data, { raw: info }).png().toBuffer();
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(mark).resize(size, size).flatten({ background }).png()
    .toFile(fileURLToPath(new URL(name, out)));
}
