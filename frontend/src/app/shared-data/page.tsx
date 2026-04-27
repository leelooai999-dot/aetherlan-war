import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function load(relativePath: string) {
  try {
    return await readFile(resolve(process.cwd(), '..', 'tools', 'animation-pipeline', 'output', relativePath), 'utf8');
  } catch {
    return null;
  }
}

export default async function SharedDataPage() {
  const [progress, queue, gate] = await Promise.all([
    load('progress-summary.json'),
    load('queue-dashboard.json'),
    load('runtime-gate.json'),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Shared data layer</p>
          <h1 className="mt-2 text-4xl font-bold">埃瑟兰工具端 / 内部端 / 试玩端共享数据源</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            当前最快共享方案是三端都直接读取同一份 animation pipeline 输出 JSON。这样不用先做远程数据库，也能保证内部工具端、公共工具端与试玩端共用同一组实时文件产物。
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">progress-summary.json</h2>
            <pre className="mt-4 overflow-auto text-xs text-slate-300">{progress ?? 'missing'}</pre>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">queue-dashboard.json</h2>
            <pre className="mt-4 overflow-auto text-xs text-slate-300">{queue ?? 'missing'}</pre>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">runtime-gate.json</h2>
            <pre className="mt-4 overflow-auto text-xs text-slate-300">{gate ?? 'missing'}</pre>
          </article>
        </section>
      </div>
    </main>
  );
}
