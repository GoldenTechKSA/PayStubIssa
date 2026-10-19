#!/usr/bin/env node
/**
 * Generate the gallery thumbnail for each pay-stub template.
 *
 *   node scripts/make-template-thumbs.js [template-name ...]
 *
 * 1. Runs the Jest render harness (src/__test__/render-templates.harness.test.ts), which
 *    writes one standalone HTML page per template with the dev seed data into .snapshots/.
 * 2. Screenshots the top 720 x 560 CSS px of each page (the header and first tables, the
 *    same 9:7 shape as the 72 x 56 card image in TemplateStep) at half scale, giving a
 *    360 x 280 PNG at public/images/templates/thumb-<name>.png.
 * 3. Points that template's `imageFile` in public/configs/template-configs.json at it.
 *
 * Re-run after changing a template's layout so the gallery card stays truthful.
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAP = path.join(ROOT, '.snapshots');
const THUMBS = path.join(ROOT, 'public', 'images', 'templates');
const REGISTRY = path.join(ROOT, 'public', 'configs', 'template-configs.json');
const names = process.argv.slice(2);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));
if (!CHROME) {
  console.error('Chrome not found');
  process.exit(2);
}

fs.mkdirSync(SNAP, { recursive: true });
fs.mkdirSync(THUMBS, { recursive: true });

const renderOne = (name) => {
  const env = { ...process.env, CI: 'true', RENDER_DIR: SNAP };
  if (name) env.RENDER_TEMPLATE = name;
  const r = spawnSync('npx', ['react-scripts', 'test', '--watchAll=false', 'render-templates.harness'],
    { cwd: ROOT, env, shell: true, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    process.exit(1);
  }
};

if (names.length) names.forEach(n => renderOne(n)); else renderOne();

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const entries = registry.filter(t => {
  const name = t.configFile.split('/')[2];
  return !names.length || names.includes(name);
});

for (const t of entries) {
  const name = t.configFile.split('/')[2];
  const html = path.join(SNAP, name + '.html');
  if (!fs.existsSync(html)) {
    console.error('no rendered page for ' + name + ' (is it in template-configs.json?)');
    process.exit(1);
  }
  const png = path.join(THUMBS, 'thumb-' + name.replace(/^template-/, '') + '.png');
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--virtual-time-budget=4000', '--run-all-compositor-stages-before-draw',
    '--force-device-scale-factor=0.5', '--window-size=720,560',
    '--screenshot=' + png, 'file:///' + html.replace(/\\/g, '/'),
  ], { stdio: 'pipe' });
  t.imageFile = 'templates/' + path.basename(png);
  const b = fs.readFileSync(png);
  console.log(`${b.readUInt32BE(16)}x${b.readUInt32BE(20)}  ${(b.length / 1024).toFixed(0).padStart(3)} KB  ${t.imageFile}`);
}

fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
console.log('\nupdated ' + path.relative(ROOT, REGISTRY));
