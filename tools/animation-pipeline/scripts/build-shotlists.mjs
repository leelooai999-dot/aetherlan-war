import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const shotlistsDir = join(outputDir, 'shotlists');

export async function buildShotlists() {
  await mkdir(shotlistsDir, { recursive: true });
  const priority = JSON.parse(await readFile(join(outputDir, 'brief-priority.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));

  for (const ranked of priority.ranked.slice(0, 2)) {
    const task = tasks.tasks.find((item) => item.characterId === ranked.characterId);
    const shotlist = {
      generatedAt: new Date().toISOString(),
      characterId: ranked.characterId,
      displayName: ranked.displayName,
      shots: [
        {
          id: 'master-reference',
          type: 'reference',
          goal: 'Lock identity before animation production',
          prompt: task.actions.find((a) => a.action === 'master')?.prompt ?? '',
          output: 'single master PNG'
        },
        ...task.actions
          .filter((a) => a.action !== 'master')
          .map((action, index) => ({
            id: `shot-${index + 1}`,
            type: action.action,
            goal: `Produce usable ${action.action} material for animation pipeline`,
            prompt: action.prompt,
            output: action.outputHint
          }))
      ]
    };

    await writeFile(join(shotlistsDir, `${ranked.characterId}.shotlist.json`), `${JSON.stringify(shotlist, null, 2)}\n`, 'utf8');
    console.log(`shotlist: ${ranked.characterId}.shotlist.json`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildShotlists();
}
