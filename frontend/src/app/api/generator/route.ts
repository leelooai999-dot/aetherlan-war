import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

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

    const job = {
      id: jobKey,
      createdAt: new Date().toISOString(),
      status: 'queued',
      source: 'public-generator-ui',
      storage: 'vercel-ephemeral-preview',
      request: {
        role: payload.role ?? null,
        action: payload.action ?? null,
        frameCount: payload.frameCount ?? null,
        provider: payload.provider ?? null,
        notes: payload.notes ?? null,
        intent: payload.intent ?? null,
      },
      uploads: uploadedFiles,
      nextStep: 'Need persistent storage or server-side queue consumer before background removal and animation generation can run online.',
    };

    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      const params = new URLSearchParams({
        queued: '1',
        jobId: job.id,
        queueDepth: 'preview',
      });
      return NextResponse.redirect(new URL(`/generator?${params.toString()}`, request.url));
    }

    return NextResponse.json({ ok: true, status: 'queued', job, queueDepth: 'preview' });
  }

  const job = {
    id: fallbackJobKey(),
    createdAt: new Date().toISOString(),
    status: 'queued',
    source: 'public-generator-ui',
    storage: 'vercel-ephemeral-preview',
    request: {
      role: payload.role ?? null,
      action: payload.action ?? null,
      frameCount: payload.frameCount ?? null,
      provider: payload.provider ?? null,
      notes: payload.notes ?? null,
    },
    uploads: uploadedFiles,
  };

  return NextResponse.json({
    ok: true,
    status: 'queued',
    job,
    queueDepth: 'preview',
    message: 'Preview queue accepted. Persistent storage / worker hookup is still needed before real background removal and animation generation run online.',
  });
}
