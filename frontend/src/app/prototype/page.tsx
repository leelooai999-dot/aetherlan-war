import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import PrototypeClient from './PrototypeClient';
import { inferSpriteSheetLayout } from '@/lib/sprite-sheet';

type QueueResult = {
  jobId: string;
  status?: string;
  failureReason?: string | null;
  request?: {
    role?: string;
    characterId?: string;
    characterLabel?: string;
    action?: string;
    targetSlot?: string;
    assetKind?: string;
    frameCount?: string | number;
  };
  sheetWidth?: number;
  sheetHeight?: number;
  detectedFrameCount?: number;
  detectedColumns?: number;
  detectedRows?: number;
  detectedFrameWidth?: number;
  detectedFrameHeight?: number;
  previewUrl?: string | null;
  processedPreviewUrl?: string | null;
  outputs?: {
    transparentFrames?: boolean;
    atlasPacked?: boolean;
    zipReady?: boolean;
  };
};

type ShowcaseEntry = {
  url: string;
  sourceLabel: string;
  jobId: string;
  action: string;
  targetSlot?: string;
  assetKind?: string;
  frameCount?: number;
  frameWidth?: number;
  frameHeight?: number;
  columns?: number;
  rows?: number;
  fps?: number;
  isSpriteSheet?: boolean;
};

export type ShowcaseSlot = 'idle' | 'run' | 'attack' | 'hit' | 'death' | 'fullscreen';
export type ShowcaseByUnit = Record<string, Partial<Record<ShowcaseSlot, ShowcaseEntry>>>;

const ROLE_TO_UNIT_ID: Record<string, string> = {
  '人类战士': 'samuel',
  '元素法师': 'isolde',
  '月溪灵鹿': 'moon-deer',
  '异化凶兽': 'wolf',
  '暗影魔物': 'wolf',
  '魔族狂战士': 'wolf',
};

const CHARACTER_ID_TO_UNIT_ID: Record<string, string> = {
  samuel: 'samuel',
  isolde: 'isolde',
  'moon-deer': 'moon-deer',
  'mutated-beast': 'wolf',
};

const ACTION_TO_SLOT: Record<string, ShowcaseSlot | null> = {
  '待机': 'idle',
  'idle': 'idle',
  '行走': 'run',
  '冲刺': 'run',
  'run': 'run',
  '普攻': 'attack',
  '重击': 'attack',
  '施法': 'attack',
  '技能': 'attack',
  'attack': 'attack',
  'fullscreen-attack': 'fullscreen',
  '受击': 'hit',
  '僵直': 'hit',
  'hit': 'hit',
  '死亡': 'death',
  'death': 'death',
};

async function loadShowcaseByUnit(): Promise<ShowcaseByUnit> {
  try {
    const fullPath = resolve(process.cwd(), '..', 'tools', 'animation-pipeline', 'output', 'animation-manifest.json');
    const raw = await readFile(fullPath, 'utf8');
    const data = JSON.parse(raw) as { queueResults?: QueueResult[] };
    const mapped: ShowcaseByUnit = {};

    for (const result of data.queueResults ?? []) {
      const unitId = CHARACTER_ID_TO_UNIT_ID[result.request?.characterId ?? ''] ?? ROLE_TO_UNIT_ID[result.request?.role ?? ''];
      const slot = ACTION_TO_SLOT[result.request?.targetSlot ?? ''] ?? ACTION_TO_SLOT[result.request?.action ?? ''];
      if (!unitId || !slot || result.status !== 'done') continue;
      const isBattleReady = Boolean(result.processedPreviewUrl || result.outputs?.atlasPacked || result.outputs?.transparentFrames);
      if (!isBattleReady) continue;
      const url = result.processedPreviewUrl || result.previewUrl;
      if (!url) continue;

      mapped[unitId] ??= {};
      const action = result.request?.action ?? slot;
      const layout = inferSpriteSheetLayout({
        frameCount: result.request?.frameCount ?? (slot === 'hit' || slot === 'death' ? 2 : 4),
        width: result.sheetWidth,
        height: result.sheetHeight,
        detectedFrameCount: result.detectedFrameCount,
        detectedColumns: result.detectedColumns,
        detectedRows: result.detectedRows,
        detectedFrameWidth: result.detectedFrameWidth,
        detectedFrameHeight: result.detectedFrameHeight,
        action,
        targetSlot: result.request?.targetSlot ?? slot,
      });

      mapped[unitId][slot] = {
        url,
        sourceLabel: result.processedPreviewUrl ? `pipeline ${action}` : '上传参考图',
        jobId: result.jobId,
        action,
        targetSlot: result.request?.targetSlot,
        assetKind: result.request?.assetKind,
        frameCount: layout.frameCount,
        frameWidth: layout.frameWidth,
        frameHeight: layout.frameHeight,
        columns: layout.columns,
        rows: layout.rows,
        fps: layout.fps,
        isSpriteSheet: layout.isSpriteSheet,
      };
    }

    return mapped;
  } catch {
    return {};
  }
}

export default async function PrototypePage() {
  const showcaseByUnit = await loadShowcaseByUnit();
  return <PrototypeClient showcaseByUnit={showcaseByUnit} />;
}
