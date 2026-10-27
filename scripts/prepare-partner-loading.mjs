// Isolated visual verification only. Never copied into production app routes.
import fs from "node:fs";
import path from "node:path";
await import("./prepare-partner-mobile.mjs");
if (process.argv[2] !== "after") throw Error("Loading verification prepares only an isolated after copy");
const task = process.env.MOVRR_PARTNER_VISUAL_TASK;
if (!task || !/^[a-z0-9-]+$/.test(task)) throw Error("Set a fresh task-specific visual directory");
const target = path.resolve(".tmp", task, "after");
const routes = ["", "collections", "validate", "rewards", "more", "resources", "staff", "settings", "analytics", "notifications", "collections/[id]", "rewards/create", "rewards/[id]/edit"];
for (const route of routes) {
  const file = path.join(target, "app/dashboard", route, "page.tsx");
  let source = fs.readFileSync(file, "utf8");
  const match = source.match(/export default async function (\w+)/);
  if (!match) throw Error("Expected named async page: " + route);
  const original = match[1];
  source = source.replace("export default async function", "async function");
  source += `\nexport default async function VisualPage(...args: Parameters<typeof ${original}>) { await new Promise(resolve => setTimeout(resolve, 3000)); return ${original}(...args); }\n`;
  fs.writeFileSync(file, source);
}
console.log(JSON.stringify({ target, production: false, delayedRoutes: routes.length, commandsAllowed: false }));
