import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildAnimationShowcase } from '../lib/animation-showcase';

const entries = [
  {
    title: '游戏试玩首页',
    href: '/prototype',
    tag: 'Playable Demo',
    desc: '直接进入第一关试玩，查看当前战斗表现与现有战棋体验。',
  },
  {
    title: '战斗素材上传',
    href: '/generator#battle-upload',
    tag: 'Asset Upload',
    desc: '上传角色参考图、动作参考或现有序列帧，开始进入战斗动画素材处理流程。',
  },
  {
    title: '制图追踪台',
    href: '/pipeline',
    tag: 'Pipeline',
    desc: '查看当前素材生成、队列状态、缺口看板与最近一次上传回流结果。',
  },
  {
    title: '世界观设定',
    href: '/lore',
    tag: 'Lore',
    desc: '浏览埃瑟兰战记的角色、阵营与世界背景。',
  },
];

async function loadRecentQueueResults() {
  try {
    const fullPath = resolve(process.cwd(), '..', 'tools', 'animation-pipeline', 'output', 'animation-manifest.json');
    const raw = await readFile(fullPath, 'utf8');
    const data = JSON.parse(raw) as { queueResults?: unknown[] };
    return Array.isArray(data.queueResults) ? data.queueResults : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const showcase = buildAnimationShowcase((await loadRecentQueueResults()) as never[]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e2a78,_#0b1024_55%,_#050816)] text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-10">
        <div className="max-w-4xl space-y-6">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
            Aetherlan War
          </span>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight lg:text-7xl">
              埃瑟兰战记 <span className="text-cyan-300">试玩入口</span>
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-200 lg:text-xl">
              这个站点当前同时承载《埃瑟兰战记》试玩、战斗素材上传入口与制图追踪台。试玩体验和素材生产流都在高优先级推进中，所以入口会先保持集中，等自动化链路稳定后再拆分。
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {entries.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-6 shadow-2xl shadow-cyan-950/10 transition hover:border-cyan-200/40 hover:bg-white/8"
            >
              <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">{entry.tag}</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{entry.title}</h2>
              <p className="mt-4 leading-7 text-slate-200">{entry.desc}</p>
              <div className="mt-6 text-sm font-semibold text-cyan-200">进入 →</div>
            </a>
          ))}
        </div>

        {showcase.length > 0 ? (
          <section className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Animation handoff now live</p>
                <h2 className="mt-2 text-3xl font-bold text-white">试玩页对应位置开始直接吃处理后的角色状态图</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/90">
                  下面这些卡片不再只是试玩占位说明，而是直接从 animation pipeline 最近结果里取图。像待机动作这种，处理完后就会优先用相应角色的 processed preview 顶掉原先的试玩占位展示。
                </p>
              </div>
              <a href="/pipeline" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-200 hover:text-emerald-200">
                去追踪更多结果
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {showcase.map((card) => (
                <div key={card.key} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45">
                  <div className="border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">{card.title}</div>
                        <div className="text-xs text-emerald-100/80">{card.subtitle}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${card.processed ? 'bg-emerald-300/20 text-emerald-100' : 'bg-amber-300/20 text-amber-100'}`}>
                        {card.sourceLabel}
                      </div>
                    </div>
                  </div>
                  <img src={card.imageUrl} alt={card.title} className="h-64 w-full bg-slate-950/70 object-contain" />
                  <div className="grid gap-2 px-4 py-4 text-sm text-slate-200">
                    <div>动作：{card.actionLabel}</div>
                    <div>接入方式：{card.processed ? '优先替换试玩占位态' : '先作为参考图回流'}</div>
                    <div>任务：{card.jobId}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6 text-sm leading-7 text-amber-50">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Current production reality</p>
          <p className="mt-3">
            现在首页已经重新把 `/generator` 与 `/pipeline` 暴露出来，因为战斗动画素材上传和处理正处于高优先级推进中。试玩、上传、追踪三条入口都要能直接到，不该再让人靠猜路径。
          </p>
        </div>
      </section>
    </main>
  );
}
