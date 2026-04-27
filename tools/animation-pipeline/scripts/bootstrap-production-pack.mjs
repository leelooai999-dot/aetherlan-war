import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const packsRoot = join(rootDir, 'production-packs');

export async function bootstrapProductionPack() {
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));
  const top = priority.ranked[0];
  const packDir = join(packsRoot, top.characterId);

  await mkdir(join(packDir, 'incoming'), { recursive: true });
  await mkdir(join(packDir, 'reviewed'), { recursive: true });
  await mkdir(join(packDir, 'approved'), { recursive: true });
  await mkdir(join(packDir, 'exports'), { recursive: true });

  const readme = `# ${top.displayName} Production Pack\n\nPriority score: ${top.score}\nReason: ${top.reason}\n\n## Folders\n- incoming: raw AI or artist deliveries\n- reviewed: manually checked candidates\n- approved: assets ready for runtime intake\n- exports: packaged deliverables\n\n## Flow\n1. drop new Samuel assets into incoming\n2. review quality and consistency\n3. move approved files into approved\n4. copy approved files into animation-pipeline/inbox/${top.characterId}/\n5. run ingest + pipeline + runtime gate\n`;

  await writeFile(join(packDir, 'README.md'), readme, 'utf8');
  console.log(`production-pack: ${top.characterId}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await bootstrapProductionPack();
}
