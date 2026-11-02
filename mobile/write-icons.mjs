import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const icon = path.join(root, 'mobile/icon.svg');
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  const dir = path.join(root, 'android/app/src/main/res', `mipmap-${density}`);
  for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
    await sharp(icon).resize(size, size).png().toFile(path.join(dir, `${name}.png`));
  }
}
console.log('Updated Android launcher icons.');
