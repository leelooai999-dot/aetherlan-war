"use client";

import { FormEvent, useMemo, useState } from 'react';

type UploadStatus = {
  jobId: string;
  status: string;
  found: boolean;
  progress: {
    percent: number;
    stage: string;
    label: string;
  };
  request?: {
    role?: string | null;
    characterId?: string | null;
    characterLabel?: string | null;
    action?: string | null;
    targetSlot?: string | null;
    assetKind?: string | null;
    frameCount?: string | number | null;
  };
  previewUrl?: string | null;
  processedPreviewUrl?: string | null;
  sheetWidth?: number | null;
  sheetHeight?: number | null;
  detectedFrameCount?: number | null;
  detectedColumns?: number | null;
  detectedRows?: number | null;
  detectedFrameWidth?: number | null;
  detectedFrameHeight?: number | null;
};

type CharacterOption = { id: string; label: string; role: string };
type SlotOption = { id: string; label: string };
type ReplacementTarget = {
  id: string;
  label: string;
  characterId: string;
  characterLabel: string;
  role: string;
  action: string;
  targetSlot: string;
  assetKind: string;
  notesHint?: string;
};

type Props = {
  actionUrl: string;
  roles: string[];
  actions: string[];
  providers: string[];
  characters: CharacterOption[];
  targetSlots: SlotOption[];
  assetKinds: string[];
  replacementTargets: ReplacementTarget[];
  initialJobId?: string | null;
  initialRole?: string | null;
  initialAction?: string | null;
  initialCharacterId?: string | null;
  initialCharacterLabel?: string | null;
  initialTargetSlot?: string | null;
  initialAssetKind?: string | null;
  initialUploadCount?: string | null;
  initialQueueDepth?: string | null;
};

export default function GeneratorClient({
  actionUrl,
  roles,
  actions,
  providers,
  characters,
  targetSlots,
  assetKinds,
  replacementTargets,
  initialJobId,
  initialRole,
  initialAction,
  initialCharacterId,
  initialCharacterLabel,
  initialTargetSlot,
  initialAssetKind,
  initialUploadCount,
  initialQueueDepth,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const initialReplacementTarget = replacementTargets.find((item) => item.characterId === (initialCharacterId ?? characters[0]?.id ?? '') && item.targetSlot === (initialTargetSlot ?? targetSlots[0]?.id ?? '')) ?? replacementTargets[0];
  const [jobId, setJobId] = useState(initialJobId ?? '');
  const [selectedTargetId, setSelectedTargetId] = useState(initialReplacementTarget?.id ?? replacementTargets[0]?.id ?? '');
  const [role, setRole] = useState(initialRole ?? initialReplacementTarget?.role ?? roles[0] ?? '');
  const [characterId, setCharacterId] = useState(initialCharacterId ?? initialReplacementTarget?.characterId ?? characters[0]?.id ?? '');
  const [characterLabel, setCharacterLabel] = useState(initialCharacterLabel ?? initialReplacementTarget?.characterLabel ?? characters[0]?.label ?? '');
  const [action, setAction] = useState(initialAction ?? initialReplacementTarget?.action ?? '受击');
  const [targetSlot, setTargetSlot] = useState(initialTargetSlot ?? initialReplacementTarget?.targetSlot ?? targetSlots[0]?.id ?? '');
  const [assetKind, setAssetKind] = useState(initialAssetKind ?? initialReplacementTarget?.assetKind ?? assetKinds[0] ?? 'battle-animation');
  const [uploadCount, setUploadCount] = useState(initialUploadCount ?? '0');
  const [queueDepth, setQueueDepth] = useState(initialQueueDepth ?? '-');
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTarget = useMemo(
    () => replacementTargets.find((item) => item.id === selectedTargetId) ?? replacementTargets[0] ?? null,
    [replacementTargets, selectedTargetId],
  );

  const pipelineHref = useMemo(() => {
    const params = new URLSearchParams({
      recentJobId: jobId || '',
      recentRole: role || '',
      recentAction: action || '',
      recentUploadCount: uploadCount || '0',
      recentCharacterId: characterId || '',
      recentCharacterLabel: characterLabel || '',
      recentTargetSlot: targetSlot || '',
      recentAssetKind: assetKind || '',
    });
    return `/pipeline?${params.toString()}`;
  }, [jobId, role, action, uploadCount, characterId, characterLabel, targetSlot, assetKind]);

  function applyReplacementTarget(targetId: string) {
    const nextTarget = replacementTargets.find((item) => item.id === targetId);
    if (!nextTarget) return;
    setSelectedTargetId(nextTarget.id);
    setRole(nextTarget.role);
    setCharacterId(nextTarget.characterId);
    setCharacterLabel(nextTarget.characterLabel);
    setAction(nextTarget.action);
    setTargetSlot(nextTarget.targetSlot);
    setAssetKind(nextTarget.assetKind);
  }

  async function pollStatus(nextJobId: string) {
    for (let i = 0; i < 25; i += 1) {
      const res = await fetch(`/api/generator/status?jobId=${encodeURIComponent(nextJobId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        setStatus(data);
        if (data.progress?.percent >= 65 || data.status === 'done' || data.processedPreviewUrl) {
          return;
        }
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const files = formData.getAll('referenceFiles').filter((item): item is File => item instanceof File && item.size > 0);
      setUploadCount(String(files.length));
      setRole(String(formData.get('role') ?? ''));
      setCharacterId(String(formData.get('characterId') ?? ''));
      setCharacterLabel(String(formData.get('characterLabel') ?? ''));
      setAction(String(formData.get('action') ?? ''));
      setTargetSlot(String(formData.get('targetSlot') ?? ''));
      setAssetKind(String(formData.get('assetKind') ?? ''));

      const response = await fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
          accept: 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data?.job?.id) {
        throw new Error(data?.message || 'Upload failed');
      }

      const nextJobId = data.job.id as string;
      setJobId(nextJobId);
      setQueueDepth(String(data.queueDepth ?? '-'));
      setStatus({
        jobId: nextJobId,
        status: data.status ?? 'queued',
        found: true,
        request: {
          role: String(formData.get('role') ?? ''),
          characterId: String(formData.get('characterId') ?? ''),
          characterLabel: String(formData.get('characterLabel') ?? ''),
          action: String(formData.get('action') ?? ''),
          targetSlot: String(formData.get('targetSlot') ?? ''),
          assetKind: String(formData.get('assetKind') ?? ''),
        },
        progress: {
          percent: 10,
          stage: 'upload-complete',
          label: '上传完成，正在等待后台处理',
        },
      });

      await pollStatus(nextJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Generator Form</p>
        <h2 className="mt-2 text-2xl font-bold">配置这次生成任务</h2>

        <form onSubmit={onSubmit} encType="multipart/form-data" className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-400/5 p-4">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-200">准确替换项目</div>
            <p className="mt-2 text-sm leading-7 text-slate-200">先直接选择你要替换的具体项目。选中后，角色 / 动作 / 槽位 / 用途会自动绑定，上传时更不容易传错。</p>
            <label className="mt-4 grid gap-2 text-sm text-slate-200">
              替换目标
              <select
                name="replacementTarget"
                value={selectedTargetId}
                onChange={(event) => applyReplacementTarget(event.target.value)}
                className="rounded-2xl border border-cyan-300/20 bg-slate-950/70 px-4 py-3 outline-none"
              >
                {replacementTargets.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            {selectedTarget ? (
              <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-7 text-slate-100 md:grid-cols-2">
                <div><span className="text-slate-400">角色：</span>{selectedTarget.characterLabel}</div>
                <div><span className="text-slate-400">职业：</span>{selectedTarget.role}</div>
                <div><span className="text-slate-400">动作：</span>{selectedTarget.action}</div>
                <div><span className="text-slate-400">替换槽位：</span>{selectedTarget.targetSlot}</div>
                <div><span className="text-slate-400">素材用途：</span>{selectedTarget.assetKind}</div>
                <div><span className="text-slate-400">说明：</span>{selectedTarget.notesHint ?? '未提供'}</div>
              </div>
            ) : null}
            <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-400/8 p-4 text-sm leading-7 text-amber-50/90">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-200">上传命名规则</div>
              <p className="mt-2">建议文件名直接带上：角色 + 动作 + 替换项目，例如：</p>
              <p className="mt-1 font-mono text-xs text-amber-100">samuel_attack_replacement.png / isolde_fullscreen_spell.png / mutated_beast_hit.png</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-200">
              角色类型
              <input name="role" value={role} readOnly className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              具体角色
              <input value={characterLabel} readOnly className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none" />
              <input type="hidden" name="characterId" value={characterId} />
              <input type="hidden" name="characterLabel" value={characterLabel} />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              动作
              <input name="action" value={action} readOnly className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              应用槽位
              <input name="targetSlot" value={targetSlot} readOnly className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              素材用途
              <input name="assetKind" value={assetKind} readOnly className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              帧数
              <input name="frameCount" defaultValue={8} type="number" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              AI Provider
              <select name="provider" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none">
                {providers.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm text-slate-200">
            参考图 / 动画素材上传（现在会保存到 job 目录）
            <input name="referenceFiles" type="file" multiple className="rounded-2xl border border-dashed border-cyan-300/25 bg-slate-950/60 px-4 py-6" />
          </label>

          <input type="hidden" name="intent" value="battle-animation-assets" />

          <label className="grid gap-2 text-sm text-slate-200">
            追加说明
            <textarea
              name="notes"
              rows={4}
              placeholder={selectedTarget?.notesHint ? `${selectedTarget.notesHint} 例如：保留当前角色比例；需要透明背景；优先适配当前替换项目。` : '比如：Samuel 普攻/受击参考，保留当前角色比例；需要透明背景；优先适配战斗全屏演出与棋盘内 sprite。'}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70">
              {submitting ? '上传中 / 轮询后台状态...' : '上传战斗动画素材（写入队列）'}
            </button>
            <a href={pipelineHref} className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/90 transition hover:border-cyan-200 hover:text-cyan-200">
              去内部追踪台看结果
            </a>
          </div>
        </form>

        {(jobId || status) ? (
          <div className="mt-6 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50">
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-200">Backend progress</div>
            <p className="mt-3 text-lg font-semibold">任务状态{jobId ? ` · ${jobId}` : ''}</p>
            <p className="mt-2 text-sm leading-7 text-emerald-100/90">
              当前队列深度：{queueDepth}。角色类型：{role || '未提供'} / 具体角色：{characterLabel || characterId || '未提供'} / 动作：{action || '未提供'} / 槽位：{targetSlot || '未提供'} / 文件数：{uploadCount || '0'}
            </p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${status?.progress?.percent ?? 0}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-emerald-50/95">
              <span>{status?.progress?.label ?? '等待状态...'}</span>
              <span>{status?.progress?.percent ?? 0}%</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-emerald-50/90 md:grid-cols-2">
              <div>1. 已上传到服务器 {status ? '✅' : '⬜'}</div>
              <div>2. 已进入队列 {status?.found ? '✅' : '⬜'}</div>
              <div>3. 后台处理中 {(status?.progress?.percent ?? 0) >= 35 ? '✅' : '⬜'}</div>
              <div>4. 已可应用到前端 {(status?.processedPreviewUrl || (status?.progress?.percent ?? 0) >= 65) ? '✅' : '⬜'}</div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-7 text-emerald-50/90">
              <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">本次绑定目标</div>
              <div className="mt-2">角色类型：{status?.request?.role ?? role ?? '未提供'}</div>
              <div>具体角色：{status?.request?.characterLabel ?? characterLabel ?? characterId ?? '未提供'}</div>
              <div>动作：{status?.request?.action ?? action ?? '未提供'}</div>
              <div>应用槽位：{status?.request?.targetSlot ?? targetSlot ?? '未提供'}</div>
              <div>素材用途：{status?.request?.assetKind ?? assetKind ?? '未提供'}</div>
            </div>
            {status?.processedPreviewUrl ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {status.previewUrl ? <img src={status.previewUrl} alt="upload preview" className="h-56 w-full rounded-2xl border border-white/10 bg-slate-950/70 object-contain" /> : null}
                <div className="rounded-2xl border border-emerald-300/20 bg-slate-950/70 p-3">
                  <img src={status.processedPreviewUrl} alt="processed preview" className="h-48 w-full object-contain" />
                  <div className="mt-3 text-xs leading-6 text-emerald-100/85">
                    <div>sheet: {status.sheetWidth ?? '?'} × {status.sheetHeight ?? '?'}</div>
                    <div>frameCount: {status.detectedFrameCount ?? status.request?.frameCount ?? '?'}</div>
                    <div>grid: {status.detectedColumns ?? '?'} × {status.detectedRows ?? '?'}</div>
                    <div>frame: {status.detectedFrameWidth ?? '?'} × {status.detectedFrameHeight ?? '?'}</div>
                  </div>
                </div>
              </div>
            ) : null}
            {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">What the pipeline returns</p>
        <h2 className="mt-2 text-2xl font-bold">自动交付内容</h2>
        <div className="mt-6 grid gap-4">
          {['透明背景角色序列帧', '自动裁边并统一尺寸', 'PixiJS 图集 PNG + JSON', '可下载 ZIP 素材包'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-100">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-400/8 p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">现在这页会做什么</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-100">
            <p>1. 上传后会明确显示“这批素材要应用到哪个角色、哪个动作、哪个槽位”。</p>
            <p>2. 进度会轮询 `/api/generator/status?jobId=...`，反映已上传、已入队、处理中、可应用四段状态。</p>
            <p>3. 一旦后台产出 processed preview，这里会直接显示透明背景预览图。</p>
            <p>4. 再点击内部追踪台，就能对同一个 job 看更详细的 pipeline 状态与目标绑定信息。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
