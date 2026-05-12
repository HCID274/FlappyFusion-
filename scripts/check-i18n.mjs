import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateContentCatalog } from '../src/content.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ALLOWED_CJK_FILES = new Set([
  path.join(SRC, 'content.js'),
]);
const CJK_RE = /[\u3400-\u9fff\u3040-\u30ff]/;

validateContentCatalog();

const hardcoded = [];
for (const file of await listSourceFiles(SRC)) {
  if (ALLOWED_CJK_FILES.has(file)) continue;
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (CJK_RE.test(line)) {
      hardcoded.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (hardcoded.length > 0) {
  throw new Error(
    `[i18n] CJK text outside src/content.js must go through the bilingual catalog:\n${hardcoded
      .map((line) => `- ${line}`)
      .join('\n')}`,
  );
}

console.log('[i18n] bilingual catalog is complete');

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listSourceFiles(fullPath));
    } else if (/\.(js|html)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}
