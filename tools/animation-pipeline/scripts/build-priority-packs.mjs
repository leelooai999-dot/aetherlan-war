import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const packsDir = join(outputDir, 'priority-packs');

export async function buildPriorityPacks() {
  await mkdir(packsDir, { recursive: true });
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));

  for (const ranked of priority.ranked.slice(0, 2)) {
    const task = tasks.tasks.find((item) => item.characterId === ranked.characterId);
    const pack = {
      generatedAt: new Date().toISOString(),
      characterId: ranked.characterId,
      displayName: ranked.displayName,
      priorityScore: ranked.score,
      priorityReason: ranked.reason,
      productionGoal: 'Create the first production-usable tactical animation asset set for Aetherlan War.',
      deliverables: task.deliverables,
      prompts: task.actions,
      technicalSpec: task.technicalSpec,
      acceptanceChecklist: [
        'master reference locked',
        'map sheet reaches full 4x4 target or approved equivalent',
        'idle/run/hit/death frame coverage complete',
        'transparent background verified',
        'pipeline audit has no action overflow errors'
      ]
    };

    await writeFile(join(packsDir, `${ranked.characterId}.priority-pack.json`), `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
    console.log(`priority-pack: ${ranked.characterId}.priority-pack.json`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildPriorityPacks();
}
