import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import GeneratorClient from './GeneratorClient';
import { buildAnimationShowcase } from '../../lib/animation-showcase';

type GeneratorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const generatorAction = process.env.NEXT_PUBLIC_GENERATOR_ACTION_URL || '/api/generator';

const roles = ['人类战士', '元素法师', '月溪灵鹿', '异化凶兽'];
const actions = ['待机', '行走', '冲刺', '普攻', '重击', '施法', '受击', '僵直', '死亡'];
const providers = ['Doubao', 'OpenAI Images', 'Gemini'];
const characters = [
  { id: 'samuel', label: 'Samuel / 塞缪尔', role: '人类战士' },
  { id: 'isolde', label: 'Isolde / 伊索尔德', role: '元素法师' },
  { id: 'moon-deer', label: 'Moon Deer / 月溪灵鹿', role: '月溪灵鹿' },
  { id: 'mutated-beast', label: 'Mutated Beast / 异化凶兽', role: '异化凶兽' },
];
const targetSlots = [
  { id: 'idle', label: '待机槽位 / idle' },
  { id: 'run', label: '移动槽位 / run' },
  { id: 'attack', label: '攻击槽位 / attack' },
  { id: 'hit', label: '受击槽位 / hit' },
  { id: 'death', label: '死亡槽位 / death' },
  { id: 'fullscreen-attack', label: '全屏演出 / fullscreen attack' },
  { id: 'portrait', label: '立绘 / portrait' },
  { id: 'profile', label: '头像 / profile' },
];
const assetKinds = ['map-sprite', 'battle-animation', 'fullscreen-fx', 'portrait', 'profile'];
const replacementTargets = [
  {
    id: 'samuel-idle',
    label: '塞缪尔 / Samuel · 待机替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '待机',
    targetSlot: 'idle',
    assetKind: 'battle-animation',
    notesHint: '替换试玩页与棋盘内 Samuel 的待机动画。',
  },
  {
    id: 'samuel-run',
    label: '塞缪尔 / Samuel · 行走替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '行走',
    targetSlot: 'run',
    assetKind: 'map-sprite',
    notesHint: '替换 Samuel 棋盘移动动画。',
  },
  {
    id: 'samuel-attack',
    label: '塞缪尔 / Samuel · 普攻替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '普攻',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    notesHint: '替换 Samuel 战斗攻击演出。',
  },
  {
    id: 'samuel-hit',
    label: '塞缪尔 / Samuel · 受击替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '受击',
    targetSlot: 'hit',
    assetKind: 'battle-animation',
    notesHint: '替换 Samuel 被击中反馈动画。',
  },
  {
    id: 'samuel-fullscreen-attack',
    label: '塞缪尔 / Samuel · 全屏攻击演出替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '普攻',
    targetSlot: 'fullscreen-attack',
    assetKind: 'fullscreen-fx',
    notesHint: '替换 Samuel 全屏战斗大招/攻击演出。',
  },
  {
    id: 'samuel-profile',
    label: '塞缪尔 / Samuel · 头像替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '待机',
    targetSlot: 'profile',
    assetKind: 'profile',
    notesHint: '替换 Samuel UI 头像。',
  },
  {
    id: 'samuel-portrait',
    label: '塞缪尔 / Samuel · 立绘替换',
    characterId: 'samuel',
    characterLabel: 'Samuel / 塞缪尔',
    role: '人类战士',
    action: '待机',
    targetSlot: 'portrait',
    assetKind: 'portrait',
    notesHint: '替换 Samuel 对话/展示立绘。',
  },
  {
    id: 'isolde-idle',
    label: '伊索尔德 / Isolde · 待机替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '待机',
    targetSlot: 'idle',
    assetKind: 'battle-animation',
    notesHint: '替换试玩页与棋盘内 Isolde 的待机动画。',
  },
  {
    id: 'isolde-run',
    label: '伊索尔德 / Isolde · 行走替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '行走',
    targetSlot: 'run',
    assetKind: 'map-sprite',
    notesHint: '替换 Isolde 棋盘移动动画。',
  },
  {
    id: 'isolde-attack',
    label: '伊索尔德 / Isolde · 施法/攻击替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '施法',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    notesHint: '替换 Isolde 战斗施法演出。',
  },
  {
    id: 'isolde-hit',
    label: '伊索尔德 / Isolde · 受击替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '受击',
    targetSlot: 'hit',
    assetKind: 'battle-animation',
    notesHint: '替换 Isolde 被击中反馈动画。',
  },
  {
    id: 'isolde-profile',
    label: '伊索尔德 / Isolde · 头像替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '待机',
    targetSlot: 'profile',
    assetKind: 'profile',
    notesHint: '替换 Isolde UI 头像。',
  },
  {
    id: 'isolde-portrait',
    label: '伊索尔德 / Isolde · 立绘替换',
    characterId: 'isolde',
    characterLabel: 'Isolde / 伊索尔德',
    role: '元素法师',
    action: '待机',
    targetSlot: 'portrait',
    assetKind: 'portrait',
    notesHint: '替换 Isolde 对话/展示立绘。',
  },
  {
    id: 'moon-deer-idle',
    label: '月溪灵鹿 / Moon Deer · 待机替换',
    characterId: 'moon-deer',
    characterLabel: 'Moon Deer / 月溪灵鹿',
    role: '月溪灵鹿',
    action: '待机',
    targetSlot: 'idle',
    assetKind: 'battle-animation',
    notesHint: '替换月溪灵鹿待机动画。',
  },
  {
    id: 'moon-deer-run',
    label: '月溪灵鹿 / Moon Deer · 行走替换',
    characterId: 'moon-deer',
    characterLabel: 'Moon Deer / 月溪灵鹿',
    role: '月溪灵鹿',
    action: '行走',
    targetSlot: 'run',
    assetKind: 'map-sprite',
    notesHint: '替换月溪灵鹿移动动画。',
  },
  {
    id: 'moon-deer-attack',
    label: '月溪灵鹿 / Moon Deer · 攻击替换',
    characterId: 'moon-deer',
    characterLabel: 'Moon Deer / 月溪灵鹿',
    role: '月溪灵鹿',
    action: '普攻',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    notesHint: '替换月溪灵鹿攻击动画。',
  },
  {
    id: 'mutated-beast-idle',
    label: '异化凶兽 / Mutated Beast · 待机替换',
    characterId: 'mutated-beast',
    characterLabel: 'Mutated Beast / 异化凶兽',
    role: '异化凶兽',
    action: '待机',
    targetSlot: 'idle',
    assetKind: 'battle-animation',
    notesHint: '替换敌方异化凶兽待机动画。',
  },
  {
    id: 'mutated-beast-run',
    label: '异化凶兽 / Mutated Beast · 行走替换',
    characterId: 'mutated-beast',
    characterLabel: 'Mutated Beast / 异化凶兽',
    role: '异化凶兽',
    action: '行走',
    targetSlot: 'run',
    assetKind: 'map-sprite',
    notesHint: '替换敌方异化凶兽移动动画。',
  },
  {
    id: 'mutated-beast-attack',
    label: '异化凶兽 / Mutated Beast · 攻击替换',
    characterId: 'mutated-beast',
    characterLabel: 'Mutated Beast / 异化凶兽',
    role: '异化凶兽',
    action: '重击',
    targetSlot: 'attack',
    assetKind: 'battle-animation',
    notesHint: '替换敌方异化凶兽攻击动画。',
  },
  {
    id: 'mutated-beast-hit',
    label: '异化凶兽 / Mutated Beast · 受击替换',
    characterId: 'mutated-beast',
    characterLabel: 'Mutated Beast / 异化凶兽',
    role: '异化凶兽',
    action: '受击',
    targetSlot: 'hit',
    assetKind: 'battle-animation',
    notesHint: '替换敌方异化凶兽受击反馈。',
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

export default async function GeneratorPage({ searchParams }: GeneratorPageProps) {
  const params = (await searchParams) ?? {};
  const showcase = buildAnimationShowcase((await loadRecentQueueResults()) as never[]);
  const jobId = typeof params.jobId === 'string' ? params.jobId : null;
  const queueDepth = typeof params.queueDepth === 'string' ? params.queueDepth : null;
  const uploadCount = typeof params.uploadCount === 'string' ? params.uploadCount : null;
  const action = typeof params.action === 'string' ? params.action : null;
  const role = typeof params.role === 'string' ? params.role : null;
  const characterId = typeof params.characterId === 'string' ? params.characterId : null;
  const characterLabel = typeof params.characterLabel === 'string' ? params.characterLabel : null;
  const targetSlot = typeof params.targetSlot === 'string' ? params.targetSlot : null;
  const assetKind = typeof params.assetKind === 'string' ? params.assetKind : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#25314f,_#0d1326_58%,_#05070d)] text-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
              公共在线工具 · One-click Asset Generator
            </span>
            <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">一键制图与图集生成前端</h1>
            <p className="max-w-3xl text-base leading-8 text-slate-200 lg:text-lg">
              面向所有用户的公共素材工具。上传任意参考图，选择角色类型与动作后，一键走透明化、裁边、图集打包和下载流程。
            </p>
          </div>
          <a
            href="/pipeline"
            className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            切换到内部追踪台
          </a>
        </div>

        <div id="battle-upload" className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">
          <div className="text-sm uppercase tracking-[0.3em] text-amber-200">Battle asset upload</div>
          <p className="mt-3 text-lg font-semibold">这里就是你要上传战斗动画素材的前端入口</p>
          <p className="mt-2 text-sm leading-7 text-amber-50/90">
            适合先上传角色参考图、动作参考、技能演出参考或现有序列帧。提交后会直接写入 queue，并把文件保存到对应 job 的 uploads 目录。
          </p>
        </div>

        {showcase.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-emerald-200">Direct replacement target</div>
                <p className="mt-3 text-lg font-semibold">处理完成后，试玩页相应位置会优先替换成这些角色状态图</p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                  比如待机动画任务完成后，就优先拿对应角色的待机态 processed preview 回流到首页/试玩相关展示区，不再只停留在上传成功提示里。
                </p>
              </div>
              <a href="/" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-200 hover:text-emerald-200">
                看替换后的试玩入口
              </a>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {showcase.slice(0, 3).map((card) => (
                <div key={card.key} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
                  <img src={card.imageUrl} alt={card.title} className="h-52 w-full object-contain bg-slate-950/70" />
                  <div className="grid gap-1 px-4 py-4 text-sm text-slate-100">
                    <div className="font-semibold text-white">{card.title}</div>
                    <div>{card.sourceLabel}</div>
                    <div>任务：{card.jobId}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <GeneratorClient
          actionUrl={generatorAction}
          roles={roles}
          actions={actions}
          providers={providers}
          characters={characters}
          targetSlots={targetSlots}
          assetKinds={assetKinds}
          replacementTargets={replacementTargets}
          initialJobId={jobId}
          initialRole={role}
          initialAction={action}
          initialCharacterId={characterId}
          initialCharacterLabel={characterLabel}
          initialTargetSlot={targetSlot}
          initialAssetKind={assetKind}
          initialUploadCount={uploadCount}
          initialQueueDepth={queueDepth}
        />
      </section>
    </main>
  );
}
