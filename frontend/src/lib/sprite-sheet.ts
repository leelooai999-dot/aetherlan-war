export type SpriteSheetGuess = {
  frameCount: number;
  columns: number;
  rows: number;
  frameWidth?: number;
  frameHeight?: number;
  fps: number;
  isSpriteSheet: boolean;
};

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function inferSpriteSheetLayout(input: {
  frameCount?: unknown;
  width?: unknown;
  height?: unknown;
  detectedFrameCount?: unknown;
  detectedColumns?: unknown;
  detectedRows?: unknown;
  detectedFrameWidth?: unknown;
  detectedFrameHeight?: unknown;
  action?: string | null;
  targetSlot?: string | null;
}): SpriteSheetGuess {
  const action = input.action ?? input.targetSlot ?? '';
  const hintedFrameCount = positiveInt(input.frameCount) ?? 1;
  const width = positiveInt(input.width);
  const height = positiveInt(input.height);
  const detectedFrameCount = positiveInt(input.detectedFrameCount);
  const detectedColumns = positiveInt(input.detectedColumns);
  const detectedRows = positiveInt(input.detectedRows);
  const detectedFrameWidth = positiveInt(input.detectedFrameWidth);
  const detectedFrameHeight = positiveInt(input.detectedFrameHeight);

  if (detectedColumns && detectedRows) {
    return {
      frameCount: detectedFrameCount ?? detectedColumns * detectedRows,
      columns: detectedColumns,
      rows: detectedRows,
      frameWidth: detectedFrameWidth ?? (width ? Math.floor(width / detectedColumns) : undefined),
      frameHeight: detectedFrameHeight ?? (height ? Math.floor(height / detectedRows) : undefined),
      fps: action === '行走' || action === '冲刺' || action === 'run'
        ? 10
        : action === '普攻' || action === '重击' || action === '施法' || action === '技能' || action === 'attack' || action === 'fullscreen-attack'
          ? 12
          : action === '受击' || action === '僵直' || action === '死亡' || action === 'hit' || action === 'death'
            ? 12
            : 8,
      isSpriteSheet: (detectedFrameCount ?? detectedColumns * detectedRows) > 1,
    };
  }

  let columns = hintedFrameCount;
  let rows = 1;

  if (width && height && hintedFrameCount > 1) {
    const aspect = width / height;
    if (aspect >= hintedFrameCount * 0.72) {
      columns = hintedFrameCount;
      rows = 1;
    } else {
      const divisors: number[] = [];
      for (let i = 1; i <= Math.sqrt(hintedFrameCount); i += 1) {
        if (hintedFrameCount % i === 0) {
          divisors.push(i);
          if (i !== hintedFrameCount / i) divisors.push(hintedFrameCount / i);
        }
      }
      const scored = divisors
        .map((candidateCols) => {
          const candidateRows = Math.ceil(hintedFrameCount / candidateCols);
          const frameWidth = width / candidateCols;
          const frameHeight = height / candidateRows;
          const frameAspect = frameWidth / Math.max(1, frameHeight);
          const squarenessPenalty = Math.abs(frameAspect - 1);
          const rowPenalty = Math.abs(candidateRows - 1.5) * 0.2;
          return {
            columns: candidateCols,
            rows: candidateRows,
            score: squarenessPenalty + rowPenalty,
          };
        })
        .sort((a, b) => a.score - b.score);

      const best = scored[0];
      if (best) {
        columns = best.columns;
        rows = best.rows;
      }
    }
  }

  const fps = action === '行走' || action === '冲刺' || action === 'run'
    ? 10
    : action === '普攻' || action === '重击' || action === '施法' || action === '技能' || action === 'attack' || action === 'fullscreen-attack'
      ? 12
      : action === '受击' || action === '僵直' || action === '死亡' || action === 'hit' || action === 'death'
        ? 12
        : 8;

  return {
    frameCount: hintedFrameCount,
    columns: Math.max(1, columns),
    rows: Math.max(1, rows),
    frameWidth: width ? Math.floor(width / Math.max(1, columns)) : undefined,
    frameHeight: height ? Math.floor(height / Math.max(1, rows)) : undefined,
    fps,
    isSpriteSheet: hintedFrameCount > 1,
  };
}
