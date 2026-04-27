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
    intent?: string;
  };
  sheetWidth?: number | null;
  sheetHeight?: number | null;
  previewUrl?: string | null;
  processedPreviewUrl?: string | null;
};

type ShowcaseCard = {
  key: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  sourceLabel: string;
  imageUrl: string;
  processed: boolean;
  jobId: string;
};

const ROLE_TO_CHARACTER: Record<string, string> = {
  '人类战士': '塞缪尔',
  '元素法师': '伊索尔德',
  '月溪灵鹿': '月溪灵鹿',
  '异化凶兽': '异化凶兽',
  '精灵弓箭手': '游侠位',
  '重甲圣殿骑士': '骑士位',
  '魔族狂战士': '敌方重击位',
  '暗影魔物': '暗影魔物位',
};

const CHARACTER_ID_TO_LABEL: Record<string, string> = {
  samuel: '塞缪尔',
  isolde: '伊索尔德',
  'moon-deer': '月溪灵鹿',
  'mutated-beast': '异化凶兽',
};

export function buildAnimationShowcase(results: QueueResult[] | null | undefined): ShowcaseCard[] {
  if (!results?.length) return [];

  const idleCards = results
    .filter((result) => result.status === 'done')
    .filter((result) => result.request?.action === '待机' || result.request?.action === '行走' || result.request?.action === '冲刺')
    .map((result) => {
      const action = result.request?.action ?? '动作';
      const role = result.request?.role ?? '未知角色';
      const character = CHARACTER_ID_TO_LABEL[result.request?.characterId ?? ''] ?? result.request?.characterLabel ?? ROLE_TO_CHARACTER[role] ?? role;
      const imageUrl = result.processedPreviewUrl || result.previewUrl;
      if (!imageUrl) return null;
      return {
        key: `${result.jobId}-${action}`,
        title: `${character}${action === '待机' ? '待机态' : action}`,
        subtitle: `${role} · job ${result.jobId}`,
        actionLabel: action,
        sourceLabel: result.processedPreviewUrl ? '已接入处理后预览' : '仅输入参考图',
        imageUrl,
        processed: Boolean(result.processedPreviewUrl),
        jobId: result.jobId,
      } satisfies ShowcaseCard;
    })
    .filter((item): item is ShowcaseCard => Boolean(item));

  const deduped = new Map<string, ShowcaseCard>();
  for (const card of idleCards) {
    const dedupeKey = `${card.title}-${card.processed ? 'processed' : 'raw'}`;
    if (!deduped.has(dedupeKey) || card.processed) {
      deduped.set(dedupeKey, card);
    }
  }

  return Array.from(deduped.values()).slice(0, 6);
}
