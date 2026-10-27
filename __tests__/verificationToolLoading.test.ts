// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

it.each([
  "scripts/capture-partner-visual.cjs",
  "scripts/verify-partner-interactions.cjs",
  "docs/verification/partner-phone-handoff-20261025/capture.cjs",
])("loads %s with a CommonJS Playwright entry and reports launch failures", (script) => {
  const root = process.cwd();
  mkdirSync(path.join(root, ".tmp"), { recursive: true });
  const fixture = mkdtempSync(path.join(root, ".tmp", "lint-tools-smoke-"));
  try {
    const modules = path.join(fixture, "node_modules");
    for (const [name, source] of [
      ["playwright-fixture", "module.exports={chromium:{launch:async()=>{throw Error('isolated-launch-reached')}}};"],
      ["pngjs", "module.exports={PNG:{}};"],
      ["jsqr", "module.exports=()=>null;"],
    ]) {
      mkdirSync(path.join(modules, name), { recursive: true });
      writeFileSync(path.join(modules, name, "index.js"), source);
    }
    mkdirSync(path.join(fixture, ".next/static/chunks"), { recursive: true });
    mkdirSync(path.join(fixture, ".next/static/media"), { recursive: true });
    writeFileSync(path.join(fixture, ".next/static/chunks/font.css"), "@font-face{font-family:Manrope;src:url(../media/font.woff2)}");
    writeFileSync(path.join(fixture, ".next/static/media/font.woff2"), "synthetic-font");
    const result = spawnSync(process.execPath, [path.join(root, script)], {
      cwd: fixture, encoding: "utf8", windowsHide: true,
      env: { ...process.env, NODE_PATH: modules, MOVRR_PLAYWRIGHT_MODULE: path.join(modules, "playwright-fixture") },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe("isolated-launch-reached");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
