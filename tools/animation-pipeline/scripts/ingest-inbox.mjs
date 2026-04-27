import { mkdir, readdir, copyFile, access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const projectRoot = resolve(rootDir, '..', '..');
const inboxDir = join(rootDir, 'inbox');
const configDir = join(rootDir, 'config');
const logPath = join(rootDir, 'output', 'ingest-log.json');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadConfigs() {
  const files = (await readdir(configDir)).filter((file) => file.startsWith('characters.') && file.endsWith('.json'));
  const items = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(configDir, file), 'utf8'))));
  return new Map(items.map((item) => [item.characterId, item]));
}

function runtimeDestFor(characterId, fileName) {
  if (fileName.includes('sprite')) {
    return join(projectRoot, 'frontend', 'public', 'characters', fileName);
  }
  if (fileName.includes('profile')) {
    return join(projectRoot, 'frontend', 'public', 'characters', fileName);
  }
  if (['.webm', '.mp4', '.png'].includes(extname(fileName)) && fileName.includes('attack')) {
    return join(projectRoot, 'frontend', 'public', 'effects', fileName);
  }
  return join(projectRoot, 'frontend', 'public', 'characters', fileName);
}

export async function ingestInbox() {
  await mkdir(inboxDir, { recursive: true });
  await mkdir(join(rootDir, 'output'), { recursive: true });
  const configs = await loadConfigs();
  const entries = await readdir(inboxDir, { withFileTypes: true });
  const events = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const characterId = entry.name;
    if (!configs.has(characterId)) {
      events.push({ characterId, status: 'skipped', reason: 'unknown character config' });
      continue;
    }

    const characterInbox = join(inboxDir, characterId);
    const files = await readdir(characterInbox);
    for (const fileName of files) {
      const src = join(characterInbox, fileName);
      const dest = runtimeDestFor(characterId, fileName);
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
      events.push({ characterId, status: 'copied', src, dest });
    }
  }

  const previous = (await exists(logPath)) ? JSON.parse(await readFile(logPath, 'utf8')) : { events: [] };
  const merged = { generatedAt: new Date().toISOString(), events: [...previous.events, ...events] };
  await writeFile(logPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`ingest: ${events.length} event(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ingestInbox();
}
