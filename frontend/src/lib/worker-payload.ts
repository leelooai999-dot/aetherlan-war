export type WorkerReadyPayload = {
  jobId: string;
  role: string;
  characterId: string;
  characterLabel: string;
  action: string;
  targetSlot: string;
  assetKind: string;
  provider: string;
  uploadCount: number;
  uploadNames: string[];
  status: 'preview-intake-received';
  nextStep: 'persist-upload-and-dispatch-worker';
};

export function buildWorkerReadyPayload(input: {
  jobId: string;
  role?: string | null;
  characterId?: string | null;
  characterLabel?: string | null;
  action?: string | null;
  targetSlot?: string | null;
  assetKind?: string | null;
  provider?: string | null;
  uploadCount?: string | number | null;
  uploadNames?: string[] | null;
}): WorkerReadyPayload {
  return {
    jobId: input.jobId,
    role: input.role ?? '未提供',
    characterId: input.characterId ?? 'unassigned',
    characterLabel: input.characterLabel ?? '未指定角色',
    action: input.action ?? '未提供',
    targetSlot: input.targetSlot ?? 'unassigned',
    assetKind: input.assetKind ?? 'battle-animation',
    provider: input.provider ?? '未提供',
    uploadCount: Number(input.uploadCount ?? 0),
    uploadNames: input.uploadNames ?? [],
    status: 'preview-intake-received',
    nextStep: 'persist-upload-and-dispatch-worker',
  };
}
