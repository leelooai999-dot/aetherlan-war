import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
    };
  }[];
  recentResults?: QueueResult[];
};

async function loadJson<T>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = resolve(process.cwd(), '..', '..', 'tools', 'animation-pipeline', 'output', relativePath);
    const raw = await readFile(fullPath, 'utf8');
    return JSON.parse(raw) as T;
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

  const [dashboard, result] = await Promise.all([
    loadJson<QueueDashboard>('queue-dashboard.json'),
    loadJson<QueueResult>(`queue-results/${jobId}.result.json`),
  ]);

  const job = dashboard?.jobs?.find((item) => item.id === jobId);
  const progress = buildProgress(result, job?.status);

  return NextResponse.json({
    ok: true,
    jobId,
    found: Boolean(job || result),
    status: result?.status ?? job?.status ?? 'unknown',
    progress,
    request: result?.request ?? job?.request ?? null,
    previewUrl: result?.previewUrl ?? null,
    processedPreviewUrl: result?.processedPreviewUrl ?? null,
    sheetWidth: result?.sheetWidth ?? null,
    sheetHeight: result?.sheetHeight ?? null,
    detectedFrameCount: result?.detectedFrameCount ?? null,
    detectedColumns: result?.detectedColumns ?? null,
    detectedRows: result?.detectedRows ?? null,
    detectedFrameWidth: result?.detectedFrameWidth ?? null,
    detectedFrameHeight: result?.detectedFrameHeight ?? null,
    outputs: result?.outputs ?? null,
    storage: job?.storage ?? null,
    queueDepth: job?.storage === 'hetzner-disk-persistent' ? 'persistent' : job?.storage === 'vercel-ephemeral-preview' ? 'preview' : null,
    queueSummary: dashboard
      ? {
          total: dashboard.total ?? null,
          queued: dashboard.queued ?? null,
          processing: dashboard.processing ?? null,
          done: dashboard.done ?? null,
          failed: dashboard.failed ?? null,
        }
      : null,
  });
}
