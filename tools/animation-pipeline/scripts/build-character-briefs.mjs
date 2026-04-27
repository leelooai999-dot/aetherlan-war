import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');
const briefsDir = join(outputDir, 'briefs');

export async function buildCharacterBriefs() {
  await mkdir(briefsDir, { recursive: true });
  const audit = JSON.parse(await readFile(join(outputDir, 'asset-audit.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));

  for (const character of audit.characters) {
    const task = tasks.tasks.find((item) => item.characterId === character.characterId);
    const lines = [];
    lines.push(`# ${character.displayName} Production Brief`);
    lines.push('');
    lines.push(`Character ID: ${character.characterId}`);
    lines.push(`Status: ${character.status}`);
    lines.push('');
    lines.push('## Asset gap');
    lines.push(`- Expected frames: ${character.expectedFrames}`);
    lines.push(`- Actual frames: ${character.actualFrames}`);
    lines.push('- Blocking issue: current tactical sprite sheet is incomplete for gameplay use.');
    lines.push('');
    lines.push('## Required deliverables');
    for (const deliverable of task.deliverables) {
      lines.push(`- ${deliverable}`);
    }
    lines.push('');
    lines.push('## Style');
    lines.push(`- ${task.style}`);
    lines.push('');
    lines.push('## Action prompts');
    for (const action of task.actions) {
      lines.push(`### ${action.action}`);
      lines.push(action.prompt);
      lines.push('');
    }
    lines.push('## Technical target');
    lines.push(`- Frame size: ${task.technicalSpec.mapFrameWidth}x${task.technicalSpec.mapFrameHeight}`);
    lines.push(`- Grid: ${task.technicalSpec.expectedRows} x ${task.technicalSpec.expectedColumns}`);
    lines.push('- Background: transparent');
    lines.push('- Identity consistency: mandatory');
    lines.push('');
    lines.push('## Current audit errors');
    for (const issue of character.issues) {
      lines.push(`- [${issue.level}] ${issue.message}`);
    }
    lines.push('');

    await writeFile(join(briefsDir, `${character.characterId}.brief.md`), `${lines.join('\n')}\n`, 'utf8');
    console.log(`brief: ${character.characterId}.brief.md`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildCharacterBriefs();
}
