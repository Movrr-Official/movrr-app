// Isolated presentation harness: empty reads, rejected commands, no real account.
// Reuses reviewed test boundaries; never changes runtime authentication sources.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const baseline = execFileSync('git', ['rev-parse', process.env.MOVRR_PARTNER_VISUAL_BASELINE ?? 'HEAD'], { encoding: 'utf8' }).trim();
const task = process.env.MOVRR_PARTNER_VISUAL_TASK ?? 'partner-mobile-app-20261025';
if (!/^[a-z0-9-]+$/.test(task)) throw Error('Visual task must be a simple directory name');
const source = fs.readFileSync('scripts/prepare-partner-visual.mjs', 'utf8')
  .replaceAll('security-partner-20261025', task)
  .replace('2e544099e5a5e61376a24879f156a63c92212bd1', baseline);
await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// Optional local read fixtures exercise populated presentations. Commands remain
// rejected by the original isolated transport. Never used by the actual app.
if (process.env.MOVRR_PARTNER_VISUAL_READ_FIXTURE) {
  const models = JSON.parse(fs.readFileSync(process.env.MOVRR_PARTNER_VISUAL_READ_FIXTURE, 'utf8').replace(/^\uFEFF/, ''));
  const allowed = ['/partners/rewards', '/partners/fulfilments/pending', '/partners/fulfilments/history', '/partners/analytics', '/partners/resources'];
  if (Object.keys(models).some(route => !allowed.includes(route))) throw Error('Only approved presentation read routes may be supplied');
  const target = path.resolve('.tmp', task, process.argv[2]);
  fs.writeFileSync(path.join(target, 'visual-read-models.json'), JSON.stringify(models));
  const clientPath = path.join(target, 'lib/platform/client.ts');
  let client = fs.readFileSync(clientPath, 'utf8');
  client = "import readModels from '@/visual-read-models.json';\n" + client.replace("if(route==='/partners/analytics')", "if(route in readModels)return readModels[route as keyof typeof readModels] as T; if(route==='/partners/analytics')");
  fs.writeFileSync(clientPath, client);
  const evidencePath = path.join(target, 'VISUAL-FIXTURE.json');
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  evidence.emptyStateOnly = false; evidence.readFixture = process.env.MOVRR_PARTNER_VISUAL_READ_FIXTURE;
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
}
