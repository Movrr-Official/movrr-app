import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Derive install icons from the approved existing MOVRR app icon.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(resolve(root, "public/pwa"), { recursive: true });
await Promise.all([192, 512].map(size => sharp(resolve(root, "app/icon.png"))
  .resize(size, size).flatten({ background: "#123c2c" }).png()
  .toFile(resolve(root, `public/pwa/icon-${size}.png`))));
const mark = await sharp(resolve(root, "app/icon.png")).resize(304, 304).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#123c2c" } })
  .composite([{ input: mark, gravity: "centre" }]).png().toFile(resolve(root, "public/pwa/icon-maskable-512.png"));
