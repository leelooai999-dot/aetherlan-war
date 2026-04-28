"use client";

import { FormEvent, useMemo, useRef, useState } from 'react';

 type UploadItemStatus = {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'queued' | 'processing' | 'ready' | 'done' | 'error';
  progress: number;
};

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
  storage?: string | null;
  queueDepth?: string | null;
  uploads?: {
    label?: string | null;
    name?: string | null;
    size?: number | null;
    type?: string | null;
  }[] | null;
  workerPayload?: {
    jobId?: string | null;
    role?: string | null;
    characterId?: string | null;
    characterLabel?: string | null;
    action?: string | null;
    targetSlot?: string | null;
    assetKind?: string | null;
    provider?: string | null;
    uploadCount?: number | null;
    uploadNames?: string[] | null;
    status?: string | null;
    nextStep?: string | null;
  } | null;
  message?: string | null;
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

function slugifySegment(value: string | null | undefined, fallback: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function splitFileName(name: string) {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0) {
    return { base: name, ext: '' };
  }
  return {
    base: name.slice(0, dotIndex),
    ext: name.slice(dotIndex),
  };
}

function buildUploadFilename(file: File, meta: { characterId?: string | null; action?: string | null; targetSlot?: string | null; assetKind?: string | null }) {
  const { base, ext } = splitFileName(file.name);
  const prefix = [
    slugifySegment(meta.characterId, 'character'),
    slugifySegment(meta.action, 'action'),
    slugifySegment(meta.targetSlot, 'slot'),
    slugifySegment(meta.assetKind, 'asset'),
  ].join('__');
  const cleanBase = slugifySegment(base, 'upload');
  return `${prefix}__${cleanBase}${ext}`;
}

const assetKindLabel: Record<string, string> = {
  'map-sprite': '地图动作 / map sprite',
  'battle-animation': '战斗动作 / battle animation',
  'fullscreen-fx': '全屏演出 / fullscreen FX',
  portrait: '立绘 / portrait',
  profile: '头像 / profile',
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

function uploadWithProgress(url: string, formData: FormData, onProgress: (percent: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const normalizedUrl = url.trim();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', normalizedUrl);
    xhr.setRequestHeader('accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.max(1, Math.round((event.loaded / event.total) * 100)));
      onProgress(percent);
    };

    xhr.onload = () => {
      let data: any = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data ?? {});
        return;
      }

      const storageHint = data?.storage ? ` [storage=${data.storage}]` : '';
      const statusHint = xhr.status ? ` (HTTP ${xhr.status})` : '';
      reject(new Error(`${data?.message || 'Upload failed'}${statusHint}${storageHint}`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Persistent intake may be unreachable or blocked by CORS / DNS.'));
    xhr.send(formData);
  });
}

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
  const [uploadItems, setUploadItems] = useState<UploadItemStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTarget = useMemo(
    () => replacementTargets.find((item) => item.id === selectedTargetId) ?? replacementTargets[0] ?? null,
    [replacementTargets, selectedTargetId],
  );

  const groupedTargets = useMemo(() => {
    const byCharacter = new Map<string, { characterLabel: string; buckets: Record<string, ReplacementTarget[]> }>();
    for (const item of replacementTargets) {
      const current = byCharacter.get(item.characterId) ?? {
        characterLabel: item.characterLabel,
        buckets: {
          'map-sprite': [],
          'battle-animation': [],
          'fullscreen-fx': [],
          portrait: [],
          profile: [],
        },
      };
      current.buckets[item.assetKind] ??= [];
      current.buckets[item.assetKind].push(item);
      byCharacter.set(item.characterId, current);
    }
    return Array.from(byCharacter.entries()).map(([characterId, value]) => ({ characterId, ...value }));
  }, [replacementTargets]);

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

  function setAllUploadItems(statusValue: UploadItemStatus['status'], progress: number) {
    setUploadItems((items) => items.map((item) => ({ ...item, status: statusValue, progress: Math.max(item.progress, progress) })));
  }

  function applyStatusProgressToItems(statusValue: UploadItemStatus['status'], progress: number) {
    setUploadItems((items) => items.map((item) => {
      const current = item.progress;
      if (statusValue === 'queued') {
        return { ...item, status: current >= 100 ? item.status : 'queued', progress: Math.max(current, progress) };
      }
      if (statusValue === 'processing') {
        return { ...item, status: current >= 100 ? item.status : 'processing', progress: Math.max(current, progress) };
      }
      if (statusValue === 'ready') {
        return { ...item, status: 'ready', progress: Math.max(current, progress) };
      }
      if (statusValue === 'done') {
        return { ...item, status: 'done', progress: 100 };
      }
      return { ...item, status: statusValue, progress: Math.max(current, progress) };
    }));
  }

  function setUploadProgress(percent: number) {
    const normalized = Math.max(1, Math.min(100, percent));
    setUploadItems((items) =>
      items.map((item, index) => {
        const spread = Math.min(8, index * 3);
        return {
          ...item,
          status: normalized >= 100 ? 'queued' : 'uploading',
          progress: Math.max(item.progress, Math.max(1, normalized - spread)),
        };
      }),
    );
  }

  async function pollStatus(nextJobId: string) {
    for (let i = 0; i < 25; i += 1) {
      const res = await fetch(`/api/generator/status?jobId=${encodeURIComponent(nextJobId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        setStatus(data);
        const percent = Math.max(5, Number(data.progress?.percent ?? 5));
        if (data.status === 'queued') {
          applyStatusProgressToItems('queued', Math.max(18, percent));
        } else if (data.status === 'processing' || percent >= 35) {
          applyStatusProgressToItems('processing', Math.max(35, percent));
        }
        if (percent >= 65 || data.processedPreviewUrl) {
          applyStatusProgressToItems('ready', Math.max(65, percent));
        }
        if (data.status === 'done') {
          applyStatusProgressToItems('done', 100);
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
      if (!files.length) {
        throw new Error('请先选择至少一个参考图或动画素材文件再上传。');
      }
      const nextRole = String(formData.get('role') ?? '');
      const nextCharacterId = String(formData.get('characterId') ?? '');
      const nextCharacterLabel = String(formData.get('characterLabel') ?? '');
      const nextAction = String(formData.get('action') ?? '');
      const nextTargetSlot = String(formData.get('targetSlot') ?? '');
      const nextAssetKind = String(formData.get('assetKind') ?? '');

      const uploadFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key === 'referenceFiles') continue;
        uploadFormData.append(key, value);
      }

      const renamedFiles = files.map((file) => {
        const uploadName = buildUploadFilename(file, {
          characterId: nextCharacterId,
          action: nextAction,
          targetSlot: nextTargetSlot,
          assetKind: nextAssetKind,
        });
        const renamedFile = new File([file], uploadName, { type: file.type || 'application/octet-stream' });
        uploadFormData.append('referenceFiles', renamedFile);
        return { original: file, uploadName };
      });

      setUploadItems(renamedFiles.map(({ original, uploadName }, index) => ({
        id: `${original.name}-${index}-${original.size}`,
        name: `${original.name} → ${uploadName}`,
        size: original.size,
        status: 'pending',
        progress: 5,
      })));
      setUploadCount(String(files.length));
      setRole(nextRole);
      setCharacterId(nextCharacterId);
      setCharacterLabel(nextCharacterLabel);
      setAction(nextAction);
      setTargetSlot(nextTargetSlot);
      setAssetKind(nextAssetKind);

      setAllUploadItems('uploading', 8);

      const data = await uploadWithProgress(actionUrl, uploadFormData, (percent) => {
        setUploadProgress(percent);
      });
      if (!data?.job?.id) {
        throw new Error(data?.message || 'Upload failed');
      }

      const nextJobId = data.job.id as string;
      setJobId(nextJobId);
      const nextQueueDepth = String(data.queueDepth ?? '-');
      setQueueDepth(nextQueueDepth);
      const returnedStorage = typeof data?.job?.storage === 'string' ? data.job.storage : null;
      const returnedMessage = typeof data?.message === 'string' ? data.message : null;
      const returnedUploads = Array.isArray(data?.job?.uploads) ? data.job.uploads : null;
      const returnedWorkerPayload = data?.workerPayload && typeof data.workerPayload === 'object' ? data.workerPayload : null;
      const queueModeLabel = data.queueDepth === 'persistent' ? '上传完成，任务已进入持久化队列' : '上传完成，当前仍是前端预览接收模式';
      const queueModeStage = data.queueDepth === 'persistent' ? 'persistent-queued' : 'preview-queued';
      const queueModePercent = data.queueDepth === 'persistent' ? 18 : 12;
      const queueModeMessage = returnedMessage ?? (data.queueDepth === 'persistent'
        ? '文件已经进入 Hetzner 持久化 intake，可继续在追踪台确认后处理状态。'
        : '当前这次上传已被前端成功接收，但如果后续没有进入本地队列看板，通常表示线上持久化 intake 还没完全接通。');
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
          percent: queueModePercent,
          stage: queueModeStage,
          label: queueModeLabel,
        },
        storage: returnedStorage,
        queueDepth: nextQueueDepth,
        uploads: returnedUploads,
        workerPayload: returnedWorkerPayload,
        message: queueModeMessage,
      });
      applyStatusProgressToItems('queued', 20);

      await pollStatus(nextJobId);
    } catch (err) {
      setAllUploadItems('error', 100);
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
              当前选中的替换目标
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
            <div className="mt-4 grid gap-4">
              {groupedTargets.map((group) => (
                <div key={group.characterId} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-sm font-semibold text-white">{group.characterLabel}</div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {Object.entries(group.buckets).map(([kind, items]) =>
                      items.length ? (
                        <div key={kind} className="rounded-2xl border border-white/8 bg-slate-950/40 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">{assetKindLabel[kind] ?? kind}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {items.map((item) => {
                              const active = item.id === selectedTargetId;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => applyReplacementTarget(item.id)}
                                  className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100'}`}
                                >
                                  {item.label.replace(/^.* · /, '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
            </div>
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
            <input
              ref={fileInputRef}
              name="referenceFiles"
              type="file"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setUploadItems(files.map((file, index) => ({
                  id: `${file.name}-${index}-${file.size}`,
                  name: file.name,
                  size: file.size,
                  status: 'pending',
                  progress: 0,
                })));
              }}
              className="rounded-2xl border border-dashed border-cyan-300/25 bg-slate-950/60 px-4 py-6"
            />
          </label>

          {uploadItems.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-200">本次上传队列</div>
              <div className="mt-3 space-y-3">
                {uploadItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-black/15 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-100">
                      <span className="truncate">{item.name}</span>
                      <span className="text-xs text-slate-400">{Math.max(1, Math.round(item.size / 1024))} KB</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                      <span>{item.status}</span>
                      <span>{item.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
              <div>接收模式：{status?.storage === 'hetzner-disk-persistent' ? 'Persistent intake ✅' : status?.storage === 'vercel-ephemeral-preview' ? 'Preview fallback ⚠️' : '等待识别 ⏳'}</div>
              <div>1. 已上传到服务器 {status || uploadItems.some((item) => item.status !== 'pending') ? '✅' : '⬜'}</div>
              <div>2. 已进入队列 {status?.found || uploadItems.some((item) => item.status === 'queued' || item.status === 'processing' || item.status === 'done') ? '✅' : '⬜'}</div>
              <div>3. 后台处理中 {(status?.progress?.percent ?? 0) >= 35 || uploadItems.some((item) => item.status === 'processing' || item.status === 'done') ? '✅' : '⬜'}</div>
              <div>4. 已可应用到前端 {(status?.processedPreviewUrl || (status?.progress?.percent ?? 0) >= 65 || uploadItems.some((item) => item.status === 'done')) ? '✅' : '⬜'}</div>
            </div>
            {status?.message ? (
              <div className={`mt-4 rounded-2xl border p-4 text-sm leading-7 ${status?.storage === 'vercel-ephemeral-preview' ? 'border-amber-300/20 bg-amber-400/10 text-amber-50' : 'border-white/10 bg-black/15 text-emerald-50/90'}`}>
                <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">状态说明</div>
                <div className="mt-2">{status.message}</div>
              </div>
            ) : null}
            {status?.uploads?.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-emerald-50/90">
                <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">服务器已记录文件</div>
                <div className="mt-2 space-y-1">
                  {status.uploads.map((upload, index) => (
                    <div key={`${upload.name ?? upload.label ?? 'upload'}-${index}`} className="flex items-center justify-between gap-3 text-xs text-emerald-100/85">
                      <span className="truncate">{upload.name ?? upload.label ?? `asset-${index + 1}`}</span>
                      <span>{upload.size ? `${Math.max(1, Math.round(upload.size / 1024))} KB` : 'size ?'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {status?.workerPayload ? (
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-50/95">
                <div className="text-xs uppercase tracking-[0.25em] text-cyan-200">下一步交接</div>
                <div className="mt-2">worker 状态：{status.workerPayload.status ?? 'unknown'}</div>
                <div>worker next step：{status.workerPayload.nextStep ?? 'unknown'}</div>
                <div>payload 上传数：{status.workerPayload.uploadCount ?? status.uploads?.length ?? 0}</div>
                {status.workerPayload.uploadNames?.length ? (
                  <div className="break-all text-xs text-cyan-100/85">payload 文件：{status.workerPayload.uploadNames.join(' | ')}</div>
                ) : null}
              </div>
            ) : null}
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
            {error ? (
              <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm leading-7 text-red-100">
                <div className="text-xs uppercase tracking-[0.25em] text-red-200">上传失败诊断</div>
                <div className="mt-2">{error}</div>
                <div className="mt-2 text-red-100/85">如果这是公网环境，请优先检查 persistent intake 域名 / SSL / CORS 是否已完成切换；如果是本地预览，再检查 action URL 是否仍指向 /api/generator。</div>
              </div>
            ) : null}
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
