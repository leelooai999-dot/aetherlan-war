import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const packsRoot = join(rootDir, 'production-packs');

export async function buildAllProductionPackTasks() {
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));

  for (const ranked of priority.ranked.slice(0, 2)) {
    const task = tasks.tasks.find((item) => item.characterId === ranked.characterId);
    const taskDir = join(packsRoot, ranked.characterId, 'tasks');
    await mkdir(taskDir, { recursive: true });

    for (const action of task.actions) {
      const payload = {
        characterId: ranked.characterId,
        displayName: ranked.displayName,
        action: action.action,
        prompt: action.prompt,
        outputHint: action.outputHint,
        technicalSpec: task.technicalSpec,
        targetFolder: `production-packs/${ranked.characterId}/incoming`,
        acceptance: [
          'transparent background',
          'consistent identity with master reference',
          'no cropped silhouette',
          'usable for tactical presentation'
        ]
      };
      await writeFile(join(taskDir, `${action.action}.task.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      console.log(`pack-task: ${ranked.characterId}/${action.action}.task.json`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildAllProductionPackTasks();
}
