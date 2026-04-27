import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { buildWorkerReadyPayload } from '@/lib/worker-payload';

function sanitizeJobForClient(job: Record<string, any>) {
  return {
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    source: job.source,
    storage: job.storage,
    request: job.request
      ? {
          role: job.request.role ?? null,
          action: job.request.action ?? null,
          frameCount: job.request.frameCount ?? null,
          intent: job.request.intent ?? null,
        }
      : undefined,
    uploads: Array.isArray(job.uploads)
      ? job.uploads.map((file: Record<string, any>, index: number) => ({
          label: `asset-${index + 1}`,
          size: file.size,
          type: file.type,
        }))
      : [],
    nextStep: job.nextStep,
  };
}

function sanitizeWorkerPayloadForClient(payload: Record<string, any>) {
  return {
    jobId: payload.jobId,
    role: payload.role,
    characterId: payload.characterId,
    characterLabel: payload.characterLabel,
    action: payload.action,
    targetSlot: payload.targetSlot,
    assetKind: payload.assetKind,
    uploadCount: payload.uploadCount,
    status: payload.status,
    nextStep: payload.nextStep,
  };
}

export const runtime = 'nodejs';

function fallbackJobKey() {
  return `gen-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 6)}`;
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      ok: false,
      message: 'Use /generator#battle-upload in the browser, or POST multipart form data to /api/generator.',
      uploadPage: new URL('/generator#battle-upload', request.url).toString(),
    },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  let payload: Record<string, unknown> = {};
  let uploadedFiles: { name: string; size: number; type: string }[] = [];

  if (contentType.includes('application/json')) {
    payload = await request.json().catch(() => ({}));
  } else {
    const formData = await request.formData();
    const entries = Object.fromEntries(formData.entries());
    payload = entries;

    const files = formData.getAll('referenceFiles').filter((item): item is File => item instanceof File && item.size > 0);
    const jobKey = fallbackJobKey();

    uploadedFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const characterId = typeof payload.characterId === 'string' ? payload.characterId : null;
    const characterLabel = typeof payload.characterLabel === 'string' ? payload.characterLabel : null;
    const targetSlot = typeof payload.targetSlot === 'string' ? payload.targetSlot : null;
    const assetKind = typeof payload.assetKind === 'string' ? payload.assetKind : null;

    const workerPayload = buildWorkerReadyPayload({
      jobId: jobKey,
      role: typeof payload.role === 'string' ? payload.role : null,
      characterId,
      characterLabel,
      action: typeof payload.action === 'string' ? payload.action : null,
      targetSlot,
      assetKind,
      provider: typeof payload.provider === 'string' ? payload.provider : null,
      uploadCount: uploadedFiles.length,
      uploadNames: uploadedFiles.map((file) => file.name),
    });

    const job = {
      id: jobKey,
      createdAt: new Date().toISOString(),
      status: 'queued',
      source: 'public-generator-ui',
      storage: 'vercel-ephemeral-preview',
      request: {
        role: payload.role ?? null,
        characterId,
        characterLabel,
        action: payload.action ?? null,
        targetSlot,
        assetKind,
        frameCount: payload.frameCount ?? null,
        provider: payload.provider ?? null,
        notes: payload.notes ?? null,
        intent: payload.intent ?? null,
      },
      uploads: uploadedFiles,
      workerPayload,
      nextStep: 'Need persistent storage or server-side queue consumer before background removal and animation generation can run online.',
    };

    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      const params = new URLSearchParams({
        queued: '1',
        jobId: job.id,
        queueDepth: 'preview',
        uploadCount: String(uploadedFiles.length),
        action: String(payload.action ?? ''),
        role: String(payload.role ?? ''),
        characterId: String(characterId ?? ''),
        characterLabel: String(characterLabel ?? ''),
        targetSlot: String(targetSlot ?? ''),
        assetKind: String(assetKind ?? ''),
        recentUploadNames: uploadedFiles.map((file) => file.name).join(' | '),
      });
      return NextResponse.redirect(new URL(`/generator?${params.toString()}`, request.url));
    }

    return NextResponse.json({
      ok: true,
      status: 'queued',
      job: sanitizeJobForClient(job),
      workerPayload: sanitizeWorkerPayloadForClient(workerPayload),
      queueDepth: 'preview',
    });
  }

  const job = {
    id: fallbackJobKey(),
    createdAt: new Date().toISOString(),
    status: 'queued',
    source: 'public-generator-ui',
    storage: 'vercel-ephemeral-preview',
    request: {
      role: payload.role ?? null,
      characterId: payload.characterId ?? null,
      characterLabel: payload.characterLabel ?? null,
      action: payload.action ?? null,
      targetSlot: payload.targetSlot ?? null,
      assetKind: payload.assetKind ?? null,
      frameCount: payload.frameCount ?? null,
      provider: payload.provider ?? null,
      notes: payload.notes ?? null,
    },
    uploads: uploadedFiles,
  };

  return NextResponse.json({
    ok: true,
    status: 'queued',
    job: sanitizeJobForClient(job),
    queueDepth: 'preview',
    message: 'Preview queue accepted. Persistent storage / worker hookup is still needed before real background removal and animation generation run online.',
  });
}
