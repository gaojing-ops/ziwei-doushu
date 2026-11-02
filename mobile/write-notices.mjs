import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const seen = new Set();
const sections = [
  '紫微命盘 · 离线自用版\nUpstream: https://github.com/Renhuai123/ziwei-doushu',
  fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'),
];
function collect(name) {
  if (seen.has(name)) return;
  seen.add(name);
  const dir = path.join(root, 'node_modules', name);
  const manifestPath = path.join(dir, 'package.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing license package: ${name}`);
  const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const licenseFiles = fs.readdirSync(dir).filter(file => /^(license|copying)(\.|$)/i.test(file));
  sections.push(`${pkg.name} ${pkg.version}\nLicense: ${pkg.license || 'See package license'}\n` + licenseFiles.filter(file => fs.statSync(path.join(dir, file)).isFile()).map(file => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n'));
  for (const child of Object.keys(pkg.dependencies || {})) collect(child);
}
for (const pkg of ['react', 'react-dom', 'framer-motion', 'clsx', 'iztro', 'lunar-javascript', '@capacitor/core']) collect(pkg);
fs.mkdirSync(path.join(root, 'mobile/public'), { recursive: true });
fs.writeFileSync(path.join(root, 'mobile/public/OPEN_SOURCE_NOTICES.txt'), sections.join('\n\n--------------------\n\n'));
console.log(`Collected ${seen.size} bundled runtime license notices.`);
