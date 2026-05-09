import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stripDisallowedDashes } from './llm.js';

const rootPath = process.cwd();
const writableBase = process.env.CONTENT_PACKS_DIR || (process.env.VERCEL ? '/tmp' : rootPath);
const writablePath = process.env.CONTENT_PACKS_PATH || path.join(writableBase, 'content-packs.json');
const seedPath = path.join(rootPath, 'content-packs.json');

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export async function readPacks() {
  const saved = await readJsonFile(writablePath);
  if (saved.length) return stripDisallowedDashes(saved);
  const seed = await readJsonFile(seedPath);
  return stripDisallowedDashes(seed);
}

export async function writePacks(packs) {
  const safePacks = stripDisallowedDashes(Array.isArray(packs) ? packs : []);
  await fs.mkdir(path.dirname(writablePath), { recursive: true });
  await fs.writeFile(writablePath, `${JSON.stringify(safePacks, null, 2)}\n`, 'utf8');
  return safePacks;
}

export async function appendPack(pack) {
  const packs = await readPacks();
  const safePack = stripDisallowedDashes(pack);
  const next = [safePack, ...packs.filter((item) => item.id !== safePack.id)];
  await writePacks(next);
  return safePack;
}
