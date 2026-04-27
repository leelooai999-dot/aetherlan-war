import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const packsRoot = join(rootDir, 'production-packs');

export async function buildProductionPackTasks() {
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));
  const top = priority.ranked[0];
  const task = tasks.tasks.find((item) => item.characterId === top.characterId);
  const taskDir = join(packsRoot, top.characterId, 'tasks');

  await mkdir(taskDir, { recursive: true });

  for (const action of task.actions) {
    const payload = {
      characterId: top.characterId,
      displayName: top.displayName,
      action: action.action,
      prompt: action.prompt,
      outputHint: action.outputHint,
      technicalSpec: task.technicalSpec,
      targetFolder: `production-packs/${top.characterId}/incoming`,
      acceptance: [
        'transparent background',
        'consistent identity with master reference',
        'no cropped silhouette',
        'usable for tactical presentation'
      ]
    };
    await writeFile(join(taskDir, `${action.action}.task.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`pack-task: ${action.action}.task.json`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildProductionPackTasks();
}
