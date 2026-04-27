import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

export async function buildProductionReport() {
  const audit = JSON.parse(await readFile(join(outputDir, 'asset-audit.json'), 'utf8'));
  const tasks = JSON.parse(await readFile(join(outputDir, 'generation-tasks.json'), 'utf8'));

  const lines = [];
  lines.push('# Aetherlan Animation Production Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Characters audited: ${audit.summary.totalCharacters}`);
  lines.push(`- OK: ${audit.summary.ok}`);
  lines.push(`- Warning: ${audit.summary.warning}`);
  lines.push(`- Error: ${audit.summary.error}`);
  lines.push('');
  lines.push('## Key finding');
  lines.push('- Current sprite assets are placeholder or partial sheets, not production-complete tactical animation sheets.');
  lines.push('- Config expects 4x4 map sheets (16 frames), but current files yield only 2 frames each.');
  lines.push('- Result: idle, run, hit, and death sequences are all incomplete.');
  lines.push('');
  lines.push('## Character status');
  for (const character of audit.characters) {
    lines.push(`### ${character.displayName} (${character.characterId})`);
    lines.push(`- Status: ${character.status}`);
    lines.push(`- Expected frames: ${character.expectedFrames}`);
    lines.push(`- Actual frames: ${character.actualFrames}`);
    lines.push(`- Source sheet: ${character.sourceSheet}`);
    lines.push(`- Source size: ${character.sourceBytes} bytes`);
    lines.push('- Issues:');
    for (const issue of character.issues) {
      lines.push(`  - [${issue.level}] ${issue.code}: ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## AI generation task summary');
  for (const task of tasks.tasks) {
    lines.push(`### ${task.displayName}`);
    lines.push(`- Style: ${task.style}`);
    lines.push(`- Deliverables: ${task.deliverables.join(', ')}`);
    lines.push(`- Map spec: ${task.technicalSpec.mapFrameWidth}x${task.technicalSpec.mapFrameHeight}, ${task.technicalSpec.expectedRows} rows x ${task.technicalSpec.expectedColumns} columns`);
    lines.push('');
  }

  lines.push('## Recommended next actions');
  lines.push('1. Generate or paint complete 16-frame map sheets for each character.');
  lines.push('2. Lock a per-character master reference before producing action frames.');
  lines.push('3. Keep map sheet limited to idle, run, hit, death.');
  lines.push('4. Build attack, skill, magic, and ultimate as separate cinematic assets.');
  lines.push('5. Re-run this pipeline after every asset drop to catch sheet mismatches immediately.');
  lines.push('');

  await writeFile(join(outputDir, 'production-report.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log('report: production-report.md');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildProductionReport();
}
