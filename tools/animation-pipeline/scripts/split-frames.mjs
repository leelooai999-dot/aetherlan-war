import { readFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const projectRoot = resolve(rootDir, '..', '..');
const configDir = join(rootDir, 'config');
const outputDir = join(rootDir, 'output', 'frames');
const pythonExe = join(rootDir, '.venv', 'bin', 'python');
const pythonScript = join(rootDir, 'python', 'split_sheet.py');

async function loadConfigs() {
  const files = (await readdir(configDir)).filter((file) => file.startsWith('characters.') && file.endsWith('.json'));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(join(configDir, file), 'utf8'))));
}

function runPython(args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(pythonExe, [pythonScript, ...args], { cwd });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`split_sheet failed (${code}): ${stderr || stdout}`));
        return;
      }
      resolvePromise(stdout.trim());
    });
  });
}

export async function splitFrames() {
  await mkdir(outputDir, { recursive: true });
  const configs = await loadConfigs();

  for (const config of configs) {
    const characterDir = join(outputDir, config.characterId);
    await mkdir(characterDir, { recursive: true });
    const sheetPath = resolve(projectRoot, 'tools', 'animation-pipeline', 'config', config.mapModule.sheet);
    const result = await runPython([
      sheetPath,
      characterDir,
      String(config.mapModule.frameWidth),
      String(config.mapModule.frameHeight),
      JSON.stringify(config.mapModule.actions)
    ], rootDir);
    console.log(`frames: ${config.characterId} ${result}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await splitFrames();
}
