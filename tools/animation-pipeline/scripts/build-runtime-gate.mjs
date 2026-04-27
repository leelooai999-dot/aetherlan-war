import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

export async function buildRuntimeGate() {
  const audit = JSON.parse(await readFile(join(outputDir, 'asset-audit.json'), 'utf8'));

  const gate = {
    generatedAt: new Date().toISOString(),
    runtimeReady: [],
    blocked: [],
    rule: 'Assets are runtime-ready only when no error-level audit issue exists.'
  };

  for (const character of audit.characters) {
    const entry = {
      characterId: character.characterId,
      displayName: character.displayName,
      status: character.status,
      expectedFrames: character.expectedFrames,
      actualFrames: character.actualFrames,
      issues: character.issues,
    };

    if (character.status === 'ok') {
      gate.runtimeReady.push(entry);
    } else {
      gate.blocked.push(entry);
    }
  }

  await writeFile(join(outputDir, 'runtime-gate.json'), `${JSON.stringify(gate, null, 2)}\n`, 'utf8');
  console.log('gate: runtime-gate.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildRuntimeGate();
}
