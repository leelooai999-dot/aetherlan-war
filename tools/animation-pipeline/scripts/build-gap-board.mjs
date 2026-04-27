import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputDir = join(rootDir, 'output');

export async function buildGapBoard() {
  const matrix = JSON.parse(await readFile(join(outputDir, 'gap-matrix.json'), 'utf8'));
  const lines = [];
  lines.push('# Aetherlan Animation Gap Board');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Character | Status | Frames | Idle | Run | Hit | Death |');
  lines.push('|---|---|---:|---|---|---|---|');

  for (const row of matrix.rows) {
    lines.push(`| ${row.displayName} | ${row.status} | ${row.actualFrames}/${row.expectedFrames} | ${row.actions.idle} | ${row.actions.run} | ${row.actions.hit} | ${row.actions.death} |`);
  }

  lines.push('');
  lines.push('## Reading this board');
  lines.push('- `present` means configured action range is currently covered by extracted frames.');
  lines.push('- `missing` means current asset set cannot support that action yet.');
  lines.push('- Use this board together with `brief-priority.json` and `priority-packs/` to decide the next production batch.');

  await writeFile(join(outputDir, 'gap-board.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log('gap-board: gap-board.md');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildGapBoard();
}
