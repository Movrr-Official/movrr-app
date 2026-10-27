import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
const out = new URL("../public/pwa/partner/", import.meta.url);
await mkdir(out, { recursive: true });
// Existing MOVRR master mark; no AI recreation, nested tile or baked dark square.
const source = new URL("mark-source.png", out);
const mark = await sharp(fileURLToPath(source)).trim({ background: "#00000000" }).png().toBuffer();
for (const size of [192, 512]) {
  const width = Math.round(size * .86);
  await sharp({ create: { width: size, height: size, channels: 4, background: "#00000000" } })
    .composite([{ input: await sharp(mark).resize(width, width, { fit: "inside" }).png().toBuffer(), gravity: "centre" }])
    .png().toFile(fileURLToPath(new URL(`icon-${size}.png`, out)));
}
// Opaque platforms require a background. Rider's bright green, white mark and
// generous optical scale replace the previous small green-on-dark inset tile.
for (const [name, size, fraction] of [["maskable-512.png", 512, .66], ["apple-touch-icon.png", 180, .76]]) {
  const white = await sharp(mark).resize(Math.round(size * fraction), Math.round(size * fraction), { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < white.data.length; i += 4) white.data[i] = white.data[i + 1] = white.data[i + 2] = 255;
  await sharp({ create: { width: size, height: size, channels: 4, background: "#23b245" } })
    .composite([{ input: await sharp(white.data, { raw: white.info }).png().toBuffer(), gravity: "centre" }])
    .png().toFile(fileURLToPath(new URL(name, out)));
}
