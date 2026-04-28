import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const configuredGeneratorActionUrl = (process.env.NEXT_PUBLIC_GENERATOR_ACTION_URL || '').trim();

type QueueResult = {
  jobId: string;
  status?: string;
  request?: {
    role?: string;
    characterId?: string;
    characterLabel?: string;
    action?: string;
    targetSlot?: string;
    assetKind?: string;
    frameCount?: string | number;
  };
  sheetWidth?: number | null;
  sheetHeight?: number | null;
  detectedFrameCount?: number | null;
  detectedColumns?: number | null;
  detectedRows?: number | null;
  detectedFrameWidth?: number | null;
  detectedFrameHeight?: number | null;
  previewUrl?: string | null;
  processedPreviewUrl?: string | null;
  outputs?: {
    transparentFrames?: boolean;
    atlasPacked?: boolean;
    zipReady?: boolean;
  };
};

type QueueDashboard = {
  total?: number;
  queued?: number;
  processing?: number;
  done?: number;
  failed?: number;
  health?: {
    ok?: boolean;
    statusMismatchCount?: number;
    orphanResultCount?: number;
  };
  statusMismatches?: {
    jobId?: string;
    jobStatus?: string;
    resultStatus?: string;
  }[];
  orphanResults?: {
    jobId?: string;
    resultStatus?: string;
  }[];
  jobs?: {
    id: string;
    status?: string;
    storage?: string;
    request?: {
      role?: string;
      characterId?: string;
      characterLabel?: string;
      action?: string;
      targetSlot?: string;
      assetKind?: string;
      frameCount?: string | number;
    };
    uploads?: {
      label?: string;
      name?: string;
      size?: number;
      type?: string;
    }[];
    workerPayload?: {
      jobId?: string;
      role?: string;
      characterId?: string;
      characterLabel?: string;
      action?: string;
      targetSlot?: string;
      assetKind?: string;
      uploadCount?: number;
      uploads?: {
        label?: string;
      }[];
      status?: string;
      nextStep?: string;
    };
  }[];
  recentResults?: QueueResult[];
};

function resolvePersistentStatusUrl(jobId: string) {
  if (!configuredGeneratorActionUrl || configuredGeneratorActionUrl.startsWith('/')) {
    return null;
  }

  try {
    const actionUrl = configuredGeneratorActionUrl.trim();
    const statusUrl = new URL(actionUrl);
    const normalizedPath = statusUrl.pathname.replace(/\/+$/, '');
    statusUrl.pathname = normalizedPath.replace(/\/api\/generator$/, '/api/generator/status');
    statusUrl.search = '';
    statusUrl.searchParams.set('jobId', jobId);
    return statusUrl;
  } catch {
    return null;
  }
}

async function loadJson<T>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = resolve(process.cwd(), '..', '..', 'tools', 'animation-pipeline', 'output', relativePath);
    const raw = await readFile(fullPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadPersistentStatus(jobId: string) {
  const statusUrl = resolvePersistentStatusUrl(jobId);
  if (!statusUrl) {
    return null;
  }

  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (payload && typeof payload === 'object') {
        return payload as Record<string, unknown>;
      }
      return null;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const normalized = payload as Record<string, unknown>;
    if (normalized.ok === false && normalized.found !== true) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

function buildProgress(result: QueueResult | null, queuedStatus?: string) {
  const effectiveStatus = result?.status ?? queuedStatus;

  if (result?.outputs?.zipReady) {
    return { percent: 100, stage: 'zip-ready', label: 'ZIP 素材包已完成' };
  }
  if (effectiveStatus === 'done') {
    return {
      percent: 100,
      stage: result?.processedPreviewUrl ? 'done-with-preview' : 'done',
      label: result?.processedPreviewUrl ? '处理完成，透明预览已生成' : '处理完成，可查看结果',
    };
  }
  if (result?.outputs?.atlasPacked) {
    return { percent: 85, stage: 'atlas-packed', label: '图集已打包' };
  }
  if (result?.outputs?.transparentFrames || result?.processedPreviewUrl) {
    return { percent: 65, stage: 'background-removed', label: '背景已移除，透明预览已生成' };
  }
  if (effectiveStatus === 'processing') {
    return { percent: 35, stage: 'processing', label: '后台正在处理上传素材' };
  }
  if (effectiveStatus === 'queued') {
    return { percent: 15, stage: 'queued', label: '上传完成，任务已进入队列' };
  }
  if (effectiveStatus === 'failed' || effectiveStatus === 'error') {
    return { percent: 100, stage: 'failed', label: '处理失败，请检查任务结果或重新上传' };
  }
  return { percent: 5, stage: 'received', label: '已收到请求，正在等待同步状态' };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ ok: false, message: 'jobId is required' }, { status: 400 });
  }

  const fallbackRequest = {
    role: searchParams.get('role') || null,
    characterId: searchParams.get('characterId') || null,
    characterLabel: searchParams.get('characterLabel') || null,
    action: searchParams.get('action') || null,
    targetSlot: searchParams.get('targetSlot') || null,
    assetKind: searchParams.get('assetKind') || null,
    frameCount: searchParams.get('frameCount') || null,
  };
  const hasFallbackRequest = Object.values(fallbackRequest).some((value) => value);
  const fallbackQueueDepth = searchParams.get('queueDepth');
  const shouldTryPersistentStatus = fallbackQueueDepth === 'persistent' || Boolean(resolvePersistentStatusUrl(jobId));

  const [dashboard, result, persistentStatus] = await Promise.all([
    loadJson<QueueDashboard>('queue-dashboard.json'),
    loadJson<QueueResult>(`queue-results/${jobId}.result.json`),
    shouldTryPersistentStatus ? loadPersistentStatus(jobId) : Promise.resolve(null),
  ]);

  if (persistentStatus?.ok) {
    const persistentFound = persistentStatus?.found === true || typeof persistentStatus?.status === 'string';
    if (persistentFound) {
      return NextResponse.json({
        ...persistentStatus,
        found: true,
        queueSummary: persistentStatus.queueSummary ?? (dashboard
          ? {
              total: dashboard.total ?? null,
              queued: dashboard.queued ?? null,
              processing: dashboard.processing ?? null,
              done: dashboard.done ?? null,
              failed: dashboard.failed ?? null,
            }
          : null),
      });
    }
  }

  const job = dashboard?.jobs?.find((item) => item.id === jobId);
  const fallbackUploadNames = (searchParams.get('recentUploadNames') || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
  const fallbackUploadCount = Number(searchParams.get('uploadCount') || fallbackUploadNames.length || 0);
  const fallbackUploads = fallbackUploadCount > 0
    ? Array.from({ length: fallbackUploadCount }, (_, index) => ({
        label: `asset-${index + 1}`,
        name: fallbackUploadNames[index] ?? null,
        size: null,
        type: null,
      }))
    : null;
  const persistentStatusCode = typeof persistentStatus?.code === 'string' ? persistentStatus.code : null;
  const persistentStatusMessage = typeof persistentStatus?.message === 'string'
    ? persistentStatus.message.trim().toLowerCase()
    : null;
  const persistentStatusValue = typeof persistentStatus?.status === 'string'
    ? persistentStatus.status
    : persistentStatusCode === 'job-not-found' || persistentStatusMessage === 'not found'
      ? 'queued'
      : undefined;
  const persistentRequest = persistentStatus?.request && typeof persistentStatus.request === 'object'
    ? persistentStatus.request
    : null;
  const persistentUploads = Array.isArray(persistentStatus?.uploads)
    ? persistentStatus.uploads
    : null;
  const shouldPromotePersistentNotFound = hasFallbackRequest
    && (fallbackQueueDepth === 'persistent' || shouldTryPersistentStatus)
    && !job
    && !result
    && persistentStatusValue === 'queued';
  const persistentStorage = typeof persistentStatus?.storage === 'string' ? persistentStatus.storage : null;
  const persistentQueueDepth = typeof persistentStatus?.queueDepth === 'string' ? persistentStatus.queueDepth : null;
  const persistentQueueSummary = persistentStatus?.queueSummary && typeof persistentStatus.queueSummary === 'object'
    ? persistentStatus.queueSummary
    : null;
  const hasPersistentStatusPayload = Boolean(persistentStatusValue || persistentRequest || persistentUploads || persistentStorage || persistentQueueDepth || persistentQueueSummary);
  const persistentStatusFound = persistentStatus?.found === true || hasPersistentStatusPayload || shouldPromotePersistentNotFound;
  const shouldUseFallbackQueuedState = hasFallbackRequest
    && (fallbackQueueDepth === 'persistent' || shouldTryPersistentStatus)
    && !job
    && !result
    && !persistentStatusValue;

  const status = result?.status ?? job?.status ?? persistentStatusValue ?? (shouldUseFallbackQueuedState ? 'queued' : 'unknown');
  const progress = result || job
    ? buildProgress(result, job?.status)
    : persistentStatusValue
      ? buildProgress(null, persistentStatusValue)
      : shouldUseFallbackQueuedState
        ? buildProgress(null, 'queued')
        : buildProgress(null, undefined);

  return NextResponse.json({
    ok: true,
    jobId,
    found: Boolean(job || result || persistentStatusFound || hasPersistentStatusPayload || shouldUseFallbackQueuedState),
    status,
    progress,
    request: result?.request ?? job?.request ?? persistentRequest ?? ((hasFallbackRequest || shouldPromotePersistentNotFound) ? fallbackRequest : null),
    previewUrl: result?.previewUrl ?? null,
    processedPreviewUrl: result?.processedPreviewUrl ?? null,
    sheetWidth: result?.sheetWidth ?? null,
    sheetHeight: result?.sheetHeight ?? null,
    detectedFrameCount: result?.detectedFrameCount ?? result?.request?.frameCount ?? job?.request?.frameCount ?? fallbackRequest.frameCount ?? null,
    detectedColumns: result?.detectedColumns ?? null,
    detectedRows: result?.detectedRows ?? null,
    detectedFrameWidth: result?.detectedFrameWidth ?? null,
    detectedFrameHeight: result?.detectedFrameHeight ?? null,
    outputs: result?.outputs ?? null,
    storage: job?.storage ?? persistentStorage ?? ((fallbackQueueDepth === 'persistent' || (shouldUseFallbackQueuedState && shouldTryPersistentStatus)) ? 'hetzner-disk-persistent' : fallbackQueueDepth === 'preview' ? 'vercel-ephemeral-preview' : null),
    uploads: job?.uploads ?? persistentUploads ?? fallbackUploads,
    workerPayload: job?.workerPayload ?? persistentStatus?.workerPayload ?? null,
    queueDepth: job?.storage === 'hetzner-disk-persistent' ? 'persistent' : job?.storage === 'vercel-ephemeral-preview' ? 'preview' : persistentQueueDepth ?? fallbackQueueDepth ?? (shouldUseFallbackQueuedState && shouldTryPersistentStatus ? 'persistent' : null),
    queueSummary: persistentQueueSummary ?? (dashboard
      ? {
          total: dashboard.total ?? null,
          queued: dashboard.queued ?? null,
          processing: dashboard.processing ?? null,
          done: dashboard.done ?? null,
          failed: dashboard.failed ?? null,
          health: dashboard.health
            ? {
                ok: dashboard.health.ok ?? null,
                statusMismatchCount: dashboard.health.statusMismatchCount ?? null,
                orphanResultCount: dashboard.health.orphanResultCount ?? null,
              }
            : null,
          statusMismatches: dashboard.statusMismatches ?? [],
          orphanResults: dashboard.orphanResults ?? [],
        }
      : null),
    message: !job && !result && (hasFallbackRequest || shouldPromotePersistentNotFound)
      ? ((fallbackQueueDepth === 'persistent' || (shouldUseFallbackQueuedState && shouldTryPersistentStatus))
        ? '上传请求已被接收并标记为持久化队列，正在等待队列镜像与处理状态同步。'
        : '上传请求已被前端接收，正在等待队列镜像与处理状态同步。')
      : null,
  });
}
