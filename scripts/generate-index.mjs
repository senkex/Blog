import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..', 'portfolio');

function gen(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const e of entries) {
    if (e.name === 'index.json') continue;
    if (e.isDirectory()) dirs.push(e.name);
    else files.push(e.name);
  }
  dirs.sort();
  files.sort();
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ dirs, files }) + '\n');
  for (const d of dirs) gen(path.join(dir, d));
}

for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (e.isDirectory()) gen(path.join(ROOT, e.name));
}

console.log('index.json generated for all portfolio folders.');
