import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function loadJson<T>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = resolve(process.cwd(), '..', 'tools', 'animation-pipeline', 'output', relativePath);
    const raw = await readFile(fullPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadQueueResults() {
  try {
    const dir = resolve(process.cwd(), '..', 'tools', 'animation-pipeline', 'output', 'queue-results');
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
    const results = await Promise.all(
      files.map(async (file) => JSON.parse(await readFile(resolve(dir, file), 'utf8')))
    );
    return results.slice(-5).reverse();
  } catch {
    return [];
  }
}

type ProgressSummary = {
  overallCompletionPercent: number;
  rows: {
    characterId: string;
    displayName: string;
    status: string;
    presentActions: number;
    totalActions: number;
    completionPercent: number;
  }[];
};

type RuntimeGate = {
  runtimeReady: { characterId: string; displayName: string }[];
  blocked: {
    characterId: string;
    displayName: string;
    status: string;
    expectedFrames: number;
    actualFrames: number;
    issues: { level: string; code?: string; message: string }[];
  }[];
};

type BriefPriority = {
  ranked: {
    characterId: string;
    displayName: string;
    score: number;
    reason: string;
  }[];
};

type GapMatrix = {
  rows: {
    characterId: string;
    displayName: string;
    status: string;
    expectedFrames: number;
    actualFrames: number;
    actions: Record<string, string>;
  }[];
};

type QueueDashboard = {
  total: number;
  queued: number;
  processing: number;
  done: number;
  failed: number;
  jobs: {
    id: string;
    status: string;
    createdAt: string;
    request?: {
      role?: string;
      action?: string;
      provider?: string;
      frameCount?: string | number;
    };
  }[];
};

type QueueResult = {
  jobId: string;
  createdAt: string;
  status: string;
  adapter?: string;
  note: string;
  request?: {
    role?: string;
    action?: string;
    provider?: string;
    frameCount?: string | number;
  };
  uploads?: { originalName?: string; jobInputPath?: string }[];
  outputs?: {
    transparentFrames?: boolean;
    atlasPacked?: boolean;
    zipReady?: boolean;
    manifest?: string;
    atlasJson?: string;
    framePlan?: string;
    bundlePlan?: string;
  };
};

export default async function PipelinePage() {
  const [progress, runtimeGate, priority, gapMatrix, queueDashboard, queueResults] = await Promise.all([
    loadJson<ProgressSummary>('progress-summary.json'),
    loadJson<RuntimeGate>('runtime-gate.json'),
    loadJson<BriefPriority>('brief-priority.json'),
    loadJson<GapMatrix>('gap-matrix.json'),
    loadJson<QueueDashboard>('queue-dashboard.json'),
    loadQueueResults() as Promise<QueueResult[]>,
  ]);

  const blockedCount = runtimeGate?.blocked.length ?? 0;
  const totalCount = blockedCount + (runtimeGate?.runtimeReady.length ?? 0);
  const topPriority = priority?.ranked.slice(0, 2).map((item) => item.displayName).join(' → ') || '等待数据';

  const trackers = [
    {
      label: '资产审计',
      value: `${blockedCount} / ${totalCount || 0} blocked`,
      desc: '当前角色动画资源 runtime gate 审计结果。',
    },
    {
      label: '总完成度',
      value: `${progress?.overallCompletionPercent ?? 0}%`,
      desc: '根据动作覆盖率自动计算的当前完成度。',
    },
    {
      label: '最高优先级',
      value: topPriority,
      desc: '优先先做的角色顺序。',
    },
  ];

  const boardRows = gapMatrix?.rows ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1b244d,_#0b1024_55%,_#04060f)] text-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
              内部生产管理台 · Aetherlan Pipeline Tracker
            </span>
            <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">埃瑟兰战记制图进程追踪台</h1>
            <p className="max-w-3xl text-base leading-8 text-slate-200 lg:text-lg">
              现在这个页面直接读取 animation pipeline 产出的 JSON，用来追踪角色资产状态、公共生成任务、结果详情、gap / runtime gate / 完成度，并推动素材流转。
            </p>
          </div>
          <a
            href="/generator"
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            切换到上传前端
          </a>
        </div>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">素材上传入口</p>
              <h2 className="mt-2 text-2xl font-bold text-white">先在这里上传战斗动画素材</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50/90">
                如果你现在要上传战斗所需动画素材，直接点下面按钮进入上传页。上传后任务会写入队列，文件会保存到对应 job 目录，随后就能在这个 pipeline 页看到队列状态和结果。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/generator"
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                立即上传素材
              </a>
              <a
                href="/generator#battle-upload"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-200 hover:text-cyan-200"
              >
                跳到战斗动画上传表单
              </a>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {trackers.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">{item.label}</div>
              <div className="mt-3 text-3xl font-bold">{item.value}</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Gap Board</p>
                <h2 className="mt-2 text-2xl font-bold">动作缺口看板</h2>
              </div>
              <span className="rounded-full bg-red-400/15 px-4 py-1 text-sm text-red-200">
                blocked {blockedCount}
              </span>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-slate-950/50 text-slate-300">
                  <tr>
                    {['角色', '状态', '帧数', 'Idle', 'Run', 'Hit', 'Death'].map((head) => (
                      <th key={head} className="px-4 py-3 font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-950/30">
                  {boardRows.map((row) => (
                    <tr key={row.characterId}>
                      <td className="px-4 py-3 text-slate-100">{row.displayName}</td>
                      <td className="px-4 py-3 text-slate-100">{row.status}</td>
                      <td className="px-4 py-3 text-slate-100">{row.actualFrames}/{row.expectedFrames}</td>
                      <td className="px-4 py-3 text-slate-100">{row.actions.idle}</td>
                      <td className="px-4 py-3 text-slate-100">{row.actions.run}</td>
                      <td className="px-4 py-3 text-slate-100">{row.actions.hit}</td>
                      <td className="px-4 py-3 text-slate-100">{row.actions.death}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">公共生成队列</p>
            <h2 className="mt-2 text-2xl font-bold">生成任务追踪</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[
                ['总任务', queueDashboard?.total ?? 0],
                ['Queued', queueDashboard?.queued ?? 0],
                ['Done', queueDashboard?.done ?? 0],
                ['Failed', queueDashboard?.failed ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm text-emerald-300">{label}</div>
                  <div className="mt-2 text-3xl font-bold">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {(queueDashboard?.jobs ?? []).slice(-5).reverse().map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{job.id}</div>
                    <div className="rounded-full bg-cyan-400/12 px-3 py-1 text-xs text-cyan-200">{job.status}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {job.request?.role ?? 'unknown role'} / {job.request?.action ?? 'unknown action'} / {job.request?.provider ?? 'unknown provider'} / {job.request?.frameCount ?? '-'} 帧
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">队列结果详情</p>
          <h2 className="mt-2 text-2xl font-bold">最近处理结果</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {queueResults.map((result) => (
              <div key={result.jobId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-white">{result.jobId}</div>
                  <div className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs text-emerald-200">{result.status}</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{result.note}</p>
                <div className="mt-4 text-sm text-slate-200">
                  {result.request?.role ?? 'unknown role'} / {result.request?.action ?? 'unknown action'} / {result.request?.provider ?? 'unknown provider'} / {result.request?.frameCount ?? '-'} 帧
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.25em] text-cyan-200">adapter: {result.adapter ?? 'n/a'}</div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div>uploads copied: {result.uploads?.length ?? 0}</div>
                  <div>transparentFrames: {String(result.outputs?.transparentFrames ?? false)}</div>
                  <div>atlasPacked: {String(result.outputs?.atlasPacked ?? false)}</div>
                  <div>zipReady: {String(result.outputs?.zipReady ?? false)}</div>
                  <div className="break-all">manifest: {result.outputs?.manifest ?? 'n/a'}</div>
                  <div className="break-all">atlasJson: {result.outputs?.atlasJson ?? 'n/a'}</div>
                  <div className="break-all">framePlan: {result.outputs?.framePlan ?? 'n/a'}</div>
                  <div className="break-all">bundlePlan: {result.outputs?.bundlePlan ?? 'n/a'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">角色完成度</p>
          <h2 className="mt-2 text-2xl font-bold">动作覆盖进度</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(progress?.rows ?? []).map((row) => (
              <div key={row.characterId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="text-sm text-emerald-300">{row.displayName}</div>
                <div className="mt-2 text-3xl font-bold">{row.completionPercent}%</div>
                <p className="mt-2 text-sm text-slate-300">
                  {row.presentActions}/{row.totalActions} actions ready
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
