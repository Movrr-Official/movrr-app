// Isolated presentation harness: empty reads, rejected commands, no real account.
// Reuses reviewed test boundaries; never changes runtime authentication sources.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const baseline = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const source = fs.readFileSync('scripts/prepare-partner-visual.mjs', 'utf8')
  .replaceAll('security-partner-20261025', 'partner-mobile-app-20261025')
  .replace('2e544099e5a5e61376a24879f156a63c92212bd1', baseline);
await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
