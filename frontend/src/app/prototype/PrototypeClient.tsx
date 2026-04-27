"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Application, BlurFilter, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";

const tileVisualSize = 56;
const spriteSheetColumns = 5;
const spriteSheetRows = 5;
const spriteFrameCount = 25;
const runSpriteScale = 3.2;
const baseRunDurationMs = 560;
const runDurationPerTileMs = 320;
const mobileTileSize = 44;
const desktopTileSize = 56;

type Team = "player" | "enemy" | "beast";
type Mode = "move" | "attack" | "skill";
type Terrain = "plain" | "forest" | "water" | "ruin";
type BattleState = "ongoing" | "victory" | "defeat";

type SpriteAnimKey = "idle" | "run" | "attack" | "jump";

type SpriteAnimDef = {
  row: number;
  frames: number;
  fps: number;
};

type SpritePresentation = {
  mapScale?: number;
  mapWidth?: number;
  mapAnchorX?: number;
  mapAnchorY?: number;
  cinematicScale?: number;
  cinematicWidth?: number;
  cinematicAnchorX?: number;
  cinematicAnchorY?: number;
};

type SpritePresentationSet = SpritePresentation & {
  idle?: SpritePresentation;
  run?: SpritePresentation;
  attack?: SpritePresentation;
  jump?: SpritePresentation;
};

type UnitShowcase = {
  idle?: ShowcaseEntry;
  run?: ShowcaseEntry;
  attack?: ShowcaseEntry;
  hit?: ShowcaseEntry;
};

type Unit = {
  id: string;
  name: string;
  x: number;
  y: number;
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  role: string;
  moveRange: number;
  desc: string;
  portrait?: string;
  profilePortrait?: string;
  runSprite?: string;
  spriteSheet?: string;
  spriteSheetCols?: number;
  spriteSheetRows?: number;
  spriteAnims?: Partial<Record<SpriteAnimKey, SpriteAnimDef>>;
  spritePresentation?: SpritePresentationSet;
  showcase?: UnitShowcase;
  showcaseIdleUrl?: string;
  showcaseSourceLabel?: string;
  showcaseJobId?: string;
  moved?: boolean;
  acted?: boolean;
};

type AutoSpriteRuntime = {
  sheet: string;
  cols: number;
  rows: number;
  row: number;
  frames: number;
  fps: number;
};

type ResolvedUnitSpriteState = AutoSpriteRuntime & {
  presentation: SpritePresentationSet;
  animKey: SpriteAnimKey;
};

type DialogueEntry = {
  speaker: string;
  line: string;
};

type BattleCinematic = {
  attacker: Unit;
  defender: Unit;
  kind: "attack" | "skill";
  damage: number;
  phase: "run" | "attack" | "impact";
  videoEffect?: string;
};

type FullscreenBattleFx = {
  attacker: Unit;
  defender: Unit;
  damage: number;
  kind: "attack" | "skill";
  combo?: boolean;
  supportCaster?: Unit | null;
  aura?: "wind" | "lunar" | "slash";
  origin?: { x: number; y: number };
  target?: { x: number; y: number };
};

type CombatFx = {
  id: number;
  unitId: string;
  kind: "attack" | "hit" | "skill" | "heal" | "return";
  value?: number;
  positive?: boolean;
};

type MovementFx = {
  unitId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  sprite?: string;
  spriteSheet?: string;
  spriteSheetCols?: number;
  spriteSheetRows?: number;
  spriteRow?: number;
  spriteFrames?: number;
  spriteFps?: number;
  spritePresentation?: SpritePresentation;
  showcaseRunUrl?: string;
  durationMs: number;
  facing: "left" | "right";
  team: Team;
  name: string;
};

const mapRows = 8;
const mapCols = 10;
const objectiveTile = { x: 1, y: 5 };

const cinematicTiming = {
  flashMs: 280,
  lockToCommitMs: 120,
  attackerFocusMs: 760,
  targetFocusMs: 980,
  phaseShiftMs: 420,
  attackImpactMs: 920,
  skillImpactMs: 1050,
  attackCleanupMs: 520,
  skillCleanupMs: 650,
};

const terrainMap: Terrain[][] = [
  ["plain", "plain", "forest", "forest", "plain", "ruin", "ruin", "plain", "plain", "plain"],
  ["plain", "forest", "forest", "plain", "plain", "ruin", "water", "water", "plain", "plain"],
  ["plain", "plain", "forest", "plain", "plain", "plain", "water", "water", "plain", "plain"],
  ["plain", "plain", "plain", "plain", "forest", "plain", "plain", "plain", "ruin", "plain"],
  ["plain", "ruin", "plain", "plain", "forest", "forest", "plain", "plain", "ruin", "plain"],
  ["plain", "ruin", "plain", "plain", "plain", "forest", "plain", "plain", "plain", "plain"],
  ["plain", "plain", "plain", "water", "water", "plain", "plain", "forest", "plain", "plain"],
  ["plain", "plain", "plain", "water", "plain", "plain", "plain", "forest", "plain", "plain"],
];

const terrainInfo: Record<Terrain, { label: string; className: string; desc: string }> = {
  plain: {
    label: "平原",
    className: "border-white/5 bg-slate-800/80 text-slate-500",
    desc: "标准地形，无额外效果。",
  },
  forest: {
    label: "森林",
    className: "border-emerald-700/60 bg-emerald-900/40 text-emerald-100",
    desc: "适合风系角色与游侠机动。",
  },
  water: {
    label: "溪流",
    className: "border-cyan-500/40 bg-cyan-500/20 text-cyan-100",
    desc: "限制近战推进，但利于治愈与感知。",
  },
  ruin: {
    label: "遗迹",
    className: "border-amber-500/40 bg-amber-500/15 text-amber-100",
    desc: "星辉与暗影力量更容易共鸣。",
  },
};

type ShowcaseEntry = {
  url: string;
  sourceLabel: string;
  jobId: string;
  action?: string;
  frameCount?: number;
  frameWidth?: number;
  frameHeight?: number;
  columns?: number;
  rows?: number;
  fps?: number;
  isSpriteSheet?: boolean;
};

type PrototypeClientProps = {
  showcaseByUnit?: Record<string, Partial<Record<'idle' | 'run' | 'attack' | 'hit', ShowcaseEntry>> | undefined>;
};

const initialUnits: Unit[] = [
  {
    id: "samuel",
    name: "塞缪尔",
    x: 1,
    y: 5,
    team: "player",
    hp: 20,
    maxHp: 20,
    atk: 6,
    role: "符文剑士",
    moveRange: 2,
    desc: "前排守护者，擅长反击与星辉斩击。",
    portrait: "/characters/samuel.png",
    profilePortrait: "/characters/samuel-profile-pic.png",
    runSprite: "/characters/elliot-run.png",
    spriteSheet: "/characters/samuel-sprite.png",
    spriteSheetCols: 11,
    spriteSheetRows: 5,
    spriteAnims: {
      idle: { row: 0, frames: 11, fps: 8 },
      run: { row: 1, frames: 10, fps: 11 },
      jump: { row: 2, frames: 10, fps: 10 },
      attack: { row: 3, frames: 10, fps: 12 },
    },
    spritePresentation: {
      mapWidth: 0.7,
      mapScale: 1.04,
      mapAnchorX: 0.5,
      mapAnchorY: 0,
      cinematicWidth: 0.68,
      cinematicScale: 1.03,
      cinematicAnchorX: 0.5,
      cinematicAnchorY: 0,
      run: {
        mapWidth: 0.74,
        mapScale: 1.08,
        mapAnchorX: 0.53,
        cinematicWidth: 0.72,
        cinematicScale: 1.08,
        cinematicAnchorX: 0.53,
      },
      attack: {
        mapWidth: 0.78,
        mapScale: 1.1,
        mapAnchorX: 0.56,
        mapAnchorY: -0.02,
        cinematicWidth: 0.76,
        cinematicScale: 1.12,
        cinematicAnchorX: 0.57,
        cinematicAnchorY: -0.03,
      },
    },
    acted: false,
  },
  {
    id: "isolde",
    name: "伊索尔德",
    x: 2,
    y: 6,
    team: "player",
    hp: 15,
    maxHp: 15,
    atk: 4,
    role: "风语术师",
    moveRange: 2,
    desc: "17岁的妹妹，擅长风系、治愈与辅助控场。",
    portrait: "/characters/isolde.png",
    profilePortrait: "/characters/isolde-profile-pic.png",
    spriteSheet: "/characters/isolde-sprite.png",
    spriteSheetCols: 11,
    spriteSheetRows: 5,
    spriteAnims: {
      idle: { row: 0, frames: 11, fps: 8 },
      run: { row: 1, frames: 10, fps: 11 },
      jump: { row: 2, frames: 10, fps: 10 },
      attack: { row: 3, frames: 10, fps: 12 },
    },
    spritePresentation: {
      mapWidth: 0.62,
      mapScale: 1.12,
      mapAnchorX: 0.51,
      mapAnchorY: -0.03,
      cinematicWidth: 0.6,
      cinematicScale: 1.16,
      cinematicAnchorX: 0.5,
      cinematicAnchorY: -0.04,
      idle: {
        mapWidth: 0.58,
        mapScale: 1.08,
        mapAnchorX: 0.5,
        mapAnchorY: -0.02,
        cinematicWidth: 0.56,
        cinematicScale: 1.12,
      },
      run: {
        mapWidth: 0.66,
        mapScale: 1.16,
        mapAnchorX: 0.53,
        mapAnchorY: -0.05,
        cinematicWidth: 0.64,
        cinematicScale: 1.2,
        cinematicAnchorX: 0.53,
        cinematicAnchorY: -0.06,
      },
      attack: {
        mapWidth: 0.7,
        mapScale: 1.18,
        mapAnchorX: 0.56,
        mapAnchorY: -0.06,
        cinematicWidth: 0.7,
        cinematicScale: 1.24,
        cinematicAnchorX: 0.56,
        cinematicAnchorY: -0.08,
      },
      jump: {
        mapWidth: 0.64,
        mapScale: 1.15,
        mapAnchorX: 0.52,
        mapAnchorY: -0.07,
        cinematicWidth: 0.62,
        cinematicScale: 1.2,
        cinematicAnchorX: 0.52,
        cinematicAnchorY: -0.1,
      },
    },
    acted: false,
  },
  {
    id: "moon-deer",
    name: "月溪灵鹿",
    x: 3,
    y: 6,
    team: "beast",
    hp: 16,
    maxHp: 16,
    atk: 3,
    role: "治愈魔兽",
    moveRange: 3,
    desc: "能踏风而行的灵鹿，是团队的移动治愈站。",
    portrait: "/characters/moon-deer.png",
    profilePortrait: "/characters/deer-profile-pic.png",
    spriteSheet: "/characters/moon-deer-sprite.png",
    spriteSheetCols: 10,
    spriteSheetRows: 5,
    spriteAnims: {
      idle: { row: 0, frames: 10, fps: 8 },
      run: { row: 1, frames: 9, fps: 11 },
      jump: { row: 2, frames: 8, fps: 10 },
      attack: { row: 3, frames: 8, fps: 12 },
    },
    spritePresentation: {
      mapWidth: 0.86,
      mapScale: 1,
      mapAnchorX: 0.5,
      mapAnchorY: -0.01,
      cinematicWidth: 0.8,
      cinematicScale: 1.04,
      cinematicAnchorX: 0.5,
      cinematicAnchorY: -0.02,
      run: {
        mapWidth: 0.9,
        mapScale: 1.03,
        mapAnchorY: -0.03,
        cinematicWidth: 0.84,
        cinematicScale: 1.08,
        cinematicAnchorY: -0.04,
      },
      attack: {
        mapWidth: 0.94,
        mapScale: 1.05,
        mapAnchorX: 0.54,
        mapAnchorY: -0.04,
        cinematicWidth: 0.88,
        cinematicScale: 1.1,
        cinematicAnchorX: 0.55,
        cinematicAnchorY: -0.05,
      },
    },
    acted: false,
  },
  {
    id: "wolf",
    name: "异化凶兽",
    x: 7,
    y: 2,
    team: "enemy",
    hp: 12,
    maxHp: 12,
    atk: 4,
    role: "突袭兽",
    moveRange: 2,
    desc: "会快速切入后排的异化魔兽。",
    portrait: "/characters/mutated-beast.png",
    profilePortrait: "/characters/mutated-monster-profile-pic.png",
    spriteSheet: "/characters/mutated-beast-sprite.png",
    spriteSheetCols: 11,
    spriteSheetRows: 5,
    spriteAnims: {
      idle: { row: 0, frames: 11, fps: 8 },
      run: { row: 1, frames: 9, fps: 11 },
      jump: { row: 2, frames: 9, fps: 10 },
      attack: { row: 3, frames: 8, fps: 12 },
    },
    spritePresentation: {
      mapWidth: 0.78,
      mapScale: 1.08,
      mapAnchorX: 0.52,
      mapAnchorY: -0.02,
      cinematicWidth: 0.72,
      cinematicScale: 1.12,
      cinematicAnchorX: 0.52,
      cinematicAnchorY: -0.03,
      run: {
        mapWidth: 0.82,
        mapScale: 1.12,
        mapAnchorX: 0.56,
        mapAnchorY: -0.05,
        cinematicWidth: 0.76,
        cinematicScale: 1.16,
        cinematicAnchorX: 0.56,
        cinematicAnchorY: -0.06,
      },
      attack: {
        mapWidth: 0.86,
        mapScale: 1.15,
        mapAnchorX: 0.58,
        mapAnchorY: -0.06,
        cinematicWidth: 0.8,
        cinematicScale: 1.2,
        cinematicAnchorX: 0.58,
        cinematicAnchorY: -0.08,
      },
    },
  },
  {
    id: "apostle",
    name: "暗影使徒",
    x: 8,
    y: 4,
    team: "enemy",
    hp: 16,
    maxHp: 16,
    atk: 5,
    role: "暗术指挥",
    moveRange: 2,
    desc: "驱动裂隙魔力的危险敌人。",
  },
];

function teamClass(team: Team) {
  if (team === "player") return "bg-cyan-400 text-slate-950";
  if (team === "beast") return "bg-violet-400 text-white";
  return "bg-rose-500 text-white";
}

function distance(a: Unit, x: number, y: number) {
  return Math.abs(a.x - x) + Math.abs(a.y - y);
}

function isAdjacent(a: Unit, b: Unit) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

function clampToBoard(x: number, y: number) {
  return x >= 0 && x < mapCols && y >= 0 && y < mapRows;
}

function buildAutoSpriteRuntime(entry: ShowcaseEntry | undefined, fallbackSlot: 'idle' | 'run' | 'attack' | 'hit'): AutoSpriteRuntime | null {
  if (!entry?.url) return null;
  const frames = Math.max(1, entry.frameCount ?? (fallbackSlot === 'hit' ? 2 : 4));
  const cols = Math.max(1, entry.columns ?? frames);
  const rows = Math.max(1, entry.rows ?? 1);
  const fps = Math.max(1, entry.fps ?? (fallbackSlot === 'run' ? 10 : fallbackSlot === 'attack' ? 12 : 8));
  return {
    sheet: entry.url,
    cols,
    rows,
    row: 0,
    frames,
    fps,
  };
}

function getUnitSpriteState(unit: Unit, flags: { selected: boolean; moving: boolean; attacking: boolean; healing: boolean }): ResolvedUnitSpriteState | null {
  const showcaseOverride = flags.attacking
    ? unit.showcase?.attack ?? unit.showcase?.hit ?? unit.showcase?.idle
    : flags.moving
      ? unit.showcase?.run ?? unit.showcase?.idle
      : flags.healing || flags.selected
        ? unit.showcase?.idle
        : unit.showcase?.idle;

  const autoSprite = buildAutoSpriteRuntime(showcaseOverride, flags.attacking ? 'attack' : flags.moving ? 'run' : 'idle');

  if ((!unit.spriteSheet || !unit.spriteAnims || !unit.spriteSheetCols || !unit.spriteSheetRows) && autoSprite) {
    return {
      ...autoSprite,
      presentation: {
        ...unit.spritePresentation,
        ...(unit.spritePresentation?.idle ?? {}),
        mapWidth: unit.spritePresentation?.mapWidth ?? 0.76,
        mapScale: unit.spritePresentation?.mapScale ?? 1.08,
        cinematicWidth: unit.spritePresentation?.cinematicWidth ?? 0.72,
        cinematicScale: unit.spritePresentation?.cinematicScale ?? 1.08,
      },
      animKey: 'idle' as SpriteAnimKey,
    };
  }

  const spriteAnims = unit.spriteAnims;
  if (!spriteAnims) return null;

  const activeKey: SpriteAnimKey = flags.attacking
    ? "attack"
    : flags.moving
      ? "run"
      : flags.healing || flags.selected
        ? (spriteAnims.jump ? "jump" : "idle")
        : "idle";

  const activeAnim = spriteAnims[activeKey];

  if (!activeAnim) return null;

  const preferredAutoSprite = autoSprite && autoSprite.frames > 1 ? autoSprite : null;

  const fallbackSheet = unit.spriteSheet;
  const fallbackCols = unit.spriteSheetCols;
  const fallbackRows = unit.spriteSheetRows;
  if (!preferredAutoSprite) {
    if (!fallbackSheet || !fallbackCols || !fallbackRows) return null;

    return {
      sheet: fallbackSheet,
      cols: fallbackCols,
      rows: fallbackRows,
      row: activeAnim.row,
      frames: Math.max(1, activeAnim.frames),
      fps: Math.max(1, activeAnim.fps),
      presentation: {
        ...unit.spritePresentation,
        ...(unit.spritePresentation?.[activeKey] ?? {}),
      },
      animKey: activeKey,
    };
  }

  return {
    sheet: preferredAutoSprite.sheet,
    cols: preferredAutoSprite.cols,
    rows: preferredAutoSprite.rows,
    row: preferredAutoSprite.row,
    frames: preferredAutoSprite.frames,
    fps: preferredAutoSprite.fps,
    presentation: {
      ...unit.spritePresentation,
      ...(unit.spritePresentation?.[activeKey] ?? {}),
    },
    animKey: activeKey,
  };
}

function buildInitialDialogue(): DialogueEntry[] {
  return [
    { speaker: "塞缪尔", line: "伊索尔德，待在我身后。裂隙的黑雾已经逼近村口了。" },
    { speaker: "伊索尔德", line: "我知道啦，哥哥。但我不是只会躲在后面的人。" },
    { speaker: "月溪灵鹿", line: "呦鸣...（灵鹿在风中发出低鸣，周围魔力开始震荡）" },
  ];
}

export default function PrototypeClient({ showcaseByUnit = {} }: PrototypeClientProps) {
  const [units, setUnits] = useState<Unit[]>(() =>
    initialUnits.map((unit) => ({
      ...unit,
      showcase: showcaseByUnit[unit.id],
      showcaseIdleUrl: showcaseByUnit[unit.id]?.idle?.url,
      showcaseSourceLabel: showcaseByUnit[unit.id]?.idle?.sourceLabel,
      showcaseJobId: showcaseByUnit[unit.id]?.idle?.jobId,
    })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [turn, setTurn] = useState<"player" | "enemy">("player");
  const [mode, setMode] = useState<Mode>("move");
  const [battleState, setBattleState] = useState<BattleState>("ongoing");
  const [turnCount, setTurnCount] = useState(1);
  const [objectiveHp, setObjectiveHp] = useState(12);
  const [eventBanner, setEventBanner] = useState("星隐乡外围告急，立即稳住防线。");
  const [dialogue, setDialogue] = useState<DialogueEntry[]>(buildInitialDialogue());
  const [log, setLog] = useState<string[]>([
    "战斗开始：塞缪尔与伊索尔德必须守住星隐乡外围。",
    "提示：伊索尔德与月溪灵鹿相邻时，可发动治疗与风系支援。",
  ]);
  const [combatFx, setCombatFx] = useState<CombatFx[]>([]);
  const [fxSeed, setFxSeed] = useState(1);
  const [movementFx, setMovementFx] = useState<MovementFx | null>(null);
  const [battleCinematic, setBattleCinematic] = useState<BattleCinematic | null>(null);
  const [fullscreenBattleFx, setFullscreenBattleFx] = useState<FullscreenBattleFx | null>(null);
  const [screenFlash, setScreenFlash] = useState<{ kind: "attack" | "skill"; aura?: "wind" | "lunar" | "slash" } | null>(null);
  const [targetFocus, setTargetFocus] = useState<{ x: number; y: number; aura?: "wind" | "lunar" | "slash"; kind: "attack" | "skill"; phase?: "lock" | "commit" } | null>(null);
  const [attackerFocus, setAttackerFocus] = useState<{ unitId: string; x: number; y: number; aura?: "wind" | "lunar" | "slash"; kind: "attack" | "skill"; phase?: "charge" | "release" } | null>(null);
  const cinematicCleanupRef = useRef<number | null>(null);
  const screenFlashCleanupRef = useRef<number | null>(null);
  const targetFocusCleanupRef = useRef<number | null>(null);
  const attackerFocusCleanupRef = useRef<number | null>(null);
  const fullscreenBattleCanvasRef = useRef<HTMLDivElement | null>(null);

  function triggerFx(unitId: string, kind: CombatFx["kind"], options?: Pick<CombatFx, "value" | "positive">) {
    const nextId = fxSeed;
    setFxSeed((prev) => prev + 1);
    setCombatFx((prev) => [...prev, { id: nextId, unitId, kind, ...options }]);
    const ttl = kind === "heal" ? 900 : kind === "return" ? 520 : 700;
    window.setTimeout(() => {
      setCombatFx((prev) => prev.filter((item) => item.id !== nextId));
    }, ttl);
  }

  const fxByUnit = useMemo(
    () =>
      combatFx.reduce<Record<string, CombatFx[]>>((acc, item) => {
        acc[item.unitId] = acc[item.unitId] ? [...acc[item.unitId], item] : [item];
        return acc;
      }, {}),
    [combatFx],
  );

  const selected = useMemo(() => units.find((u) => u.id === selectedId) ?? null, [units, selectedId]);

  const cinematicAttackerSprite = battleCinematic
    ? getUnitSpriteState(battleCinematic.attacker, {
        selected: false,
        moving: battleCinematic.phase === "run",
        attacking: battleCinematic.phase !== "run",
        healing: false,
      })
    : null;
  const cinematicDefenderSprite = battleCinematic
    ? getUnitSpriteState(battleCinematic.defender, {
        selected: false,
        moving: false,
        attacking: false,
        healing: false,
      })
    : null;
  const safeCinematicAttackerSprite = cinematicAttackerSprite && typeof cinematicAttackerSprite.cols === 'number' && typeof cinematicAttackerSprite.rows === 'number' ? cinematicAttackerSprite : null;
  const safeCinematicDefenderSprite = cinematicDefenderSprite && typeof cinematicDefenderSprite.cols === 'number' && typeof cinematicDefenderSprite.rows === 'number' ? cinematicDefenderSprite : null;

  const samuel = units.find((unit) => unit.id === "samuel");
  const isolde = units.find((unit) => unit.id === "isolde");
  const moonDeer = units.find((unit) => unit.id === "moon-deer");
  const enemies = units.filter((unit) => unit.team === "enemy");
  const playerUnits = units.filter((unit) => unit.team !== "enemy");
  const siblingBondActive = Boolean(samuel && isolde && isAdjacent(samuel, isolde));
  const healingBondActive = Boolean(isolde && moonDeer && isAdjacent(isolde, moonDeer));
  const comboReady = Boolean(samuel && isolde && siblingBondActive);
  const allPlayerActed = playerUnits.length > 0 && playerUnits.every((unit) => unit.acted);
  const defeatedEnemies = Math.max(0, 3 - enemies.length);
  const missionProgress = Math.min(100, Math.round((defeatedEnemies / 3) * 60 + ((12 - objectiveHp) / 12) * 40));
  const fullscreenBattleActive = Boolean(fullscreenBattleFx);
  const focusLineMetrics = attackerFocus && targetFocus
    ? {
        dx: targetFocus.x - attackerFocus.x,
        dy: targetFocus.y - attackerFocus.y,
        angle: Math.atan2(targetFocus.y - attackerFocus.y, targetFocus.x - attackerFocus.x),
        distance: Math.sqrt(
          (targetFocus.x - attackerFocus.x) * (targetFocus.x - attackerFocus.x) +
          (targetFocus.y - attackerFocus.y) * (targetFocus.y - attackerFocus.y),
        ),
      }
    : null;

  function getUnit(x: number, y: number) {
    return units.find((unit) => unit.x === x && unit.y === y);
  }

  function pushLog(entry: string) {
    setLog((prev) => [entry, ...prev].slice(0, 10));
  }

  function pushDialogue(speaker: string, line: string) {
    setDialogue((prev) => [{ speaker, line }, ...prev].slice(0, 6));
  }

  function markUnitActed(unitId: string) {
    setUnits((prev) => prev.map((unit) => (unit.id === unitId ? { ...unit, acted: true } : unit)));
  }

  function resetPlayerActions() {
    setUnits((prev) => prev.map((unit) => (unit.team !== "enemy" ? { ...unit, acted: false, moved: false } : unit)));
  }

  function canMoveTo(x: number, y: number) {
    if (!selected || turn !== "player" || mode !== "move" || battleState !== "ongoing" || selected.acted) return false;
    if ((selected as Unit & { moved?: boolean }).moved) return false;
    if (getUnit(x, y)) return false;
    return distance(selected, x, y) <= selected.moveRange;
  }

  function canAttack(unit: Unit) {
    if (!selected || turn !== "player" || mode !== "attack" || battleState !== "ongoing" || selected.acted) return false;
    if (unit.team !== "enemy") return false;
    return distance(selected, unit.x, unit.y) === 1;
  }

  function canUseSkill(x: number, y: number) {
    if (!selected || turn !== "player" || mode !== "skill" || battleState !== "ongoing" || selected.acted) return false;
    if (selected.id === "isolde") return distance(selected, x, y) <= 2;
    if (selected.id === "samuel") return distance(selected, x, y) <= (comboReady ? 2 : 1);
    if (selected.id === "moon-deer") return distance(selected, x, y) <= 2;
    return false;
  }

  function healUnit(targetId: string, amount: number, sourceId?: string) {
    if (sourceId) triggerFx(sourceId, "skill");
    triggerFx(targetId, "heal", { value: amount, positive: true });
    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === targetId ? { ...unit, hp: Math.min(unit.maxHp, unit.hp + amount) } : unit,
      ),
    );
  }

  function damageUnit(targetId: string, amount: number, sourceId?: string, kind: "attack" | "skill" = "attack") {
    if (sourceId) triggerFx(sourceId, kind);
    triggerFx(targetId, "hit", { value: amount, positive: false });
    setUnits((prev) =>
      prev
        .map((unit) => (unit.id === targetId ? { ...unit, hp: unit.hp - amount } : unit))
        .filter((unit) => unit.hp > 0),
    );
  }

  function playBattleCinematic(
    attacker: Unit,
    defender: Unit,
    damage: number,
    kind: "attack" | "skill",
    onDone?: () => void,
    options?: { combo?: boolean; supportCaster?: Unit | null; aura?: "wind" | "lunar" | "slash" },
  ) {
    const videoEffect = attacker.id === "samuel" && kind === "attack" ? "/effects/samuel-attack.webm" : undefined;
    if (cinematicCleanupRef.current) {
      window.clearTimeout(cinematicCleanupRef.current);
      cinematicCleanupRef.current = null;
    }
    if (screenFlashCleanupRef.current) {
      window.clearTimeout(screenFlashCleanupRef.current);
      screenFlashCleanupRef.current = null;
    }
    if (targetFocusCleanupRef.current) {
      window.clearTimeout(targetFocusCleanupRef.current);
      targetFocusCleanupRef.current = null;
    }
    if (attackerFocusCleanupRef.current) {
      window.clearTimeout(attackerFocusCleanupRef.current);
      attackerFocusCleanupRef.current = null;
    }

    setScreenFlash({ kind, aura: options?.aura ?? (kind === "skill" ? "wind" : "slash") });
    setAttackerFocus({ unitId: attacker.id, x: attacker.x, y: attacker.y, kind, aura: options?.aura ?? (kind === "skill" ? "wind" : "slash"), phase: "charge" });
    setTargetFocus({ x: defender.x, y: defender.y, kind, aura: options?.aura ?? (kind === "skill" ? "wind" : "slash"), phase: "lock" });
    screenFlashCleanupRef.current = window.setTimeout(() => {
      setScreenFlash(null);
      screenFlashCleanupRef.current = null;
    }, cinematicTiming.flashMs);
    window.setTimeout(() => {
      setTargetFocus({ x: defender.x, y: defender.y, kind, aura: options?.aura ?? (kind === "skill" ? "wind" : "slash"), phase: "commit" });
      setAttackerFocus({ unitId: attacker.id, x: attacker.x, y: attacker.y, kind, aura: options?.aura ?? (kind === "skill" ? "wind" : "slash"), phase: "release" });
    }, cinematicTiming.lockToCommitMs);
    targetFocusCleanupRef.current = window.setTimeout(() => {
      setTargetFocus(null);
      targetFocusCleanupRef.current = null;
    }, cinematicTiming.targetFocusMs);
    attackerFocusCleanupRef.current = window.setTimeout(() => {
      setAttackerFocus(null);
      attackerFocusCleanupRef.current = null;
    }, cinematicTiming.attackerFocusMs);

    setFullscreenBattleFx({
      attacker,
      defender,
      damage,
      kind,
      combo: options?.combo,
      supportCaster: options?.supportCaster ?? null,
      aura: options?.aura ?? (kind === "skill" ? "wind" : "slash"),
      origin: { x: attacker.x, y: attacker.y },
      target: { x: defender.x, y: defender.y },
    });
    setBattleCinematic({ attacker, defender, damage, kind, phase: "run", videoEffect });

    window.setTimeout(() => {
      setBattleCinematic((prev) => (prev ? { ...prev, phase: "attack" } : null));
    }, cinematicTiming.phaseShiftMs);

    window.setTimeout(() => {
      setBattleCinematic((prev) => (prev ? { ...prev, phase: "impact" } : null));
      damageUnit(defender.id, damage, attacker.id, kind);
      onDone?.();
      cinematicCleanupRef.current = window.setTimeout(() => {
        triggerFx(attacker.id, "return");
        if (kind === "skill" && damage === 0) {
          triggerFx(defender.id, "heal", { positive: true });
        } else if (kind === "skill") {
          triggerFx(defender.id, "skill");
        }
        setBattleCinematic(null);
        setFullscreenBattleFx(null);
        cinematicCleanupRef.current = null;
      }, kind === "skill" ? cinematicTiming.skillCleanupMs : cinematicTiming.attackCleanupMs);
    }, kind === "skill" ? cinematicTiming.skillImpactMs : cinematicTiming.attackImpactMs);
  }

  function handleSkill(x: number, y: number, target: Unit | undefined) {
    if (!selected || !canUseSkill(x, y)) return;

    if (selected.id === "isolde") {
      if (target && target.team !== "enemy") {
        const bonus = healingBondActive ? 2 : 0;
        markUnitActed(selected.id);
        playBattleCinematic(selected, target, 0, "skill", () => {
          healUnit(target.id, 5 + bonus, selected.id);
          setEventBanner("伊索尔德释放风愈术，前线压力暂时缓解。");
          pushDialogue("伊索尔德", "风会托住你，别倒下！");
          pushLog(`伊索尔德施放「风愈术」，为 ${target.name} 恢复 ${5 + bonus} 点生命。`);
        }, { aura: "wind" });
      } else {
        pushLog("伊索尔德的风愈术需要选中友方单位。");
        return;
      }
    }

    if (selected.id === "samuel") {
      if (target && target.team === "enemy") {
        markUnitActed(selected.id);
        if (comboReady && isolde) {
          const mainDamage = selected.atk + 3;
          const splashTargets = units.filter(
            (unit) => unit.team === "enemy" && unit.id !== target.id && distance(target, unit.x, unit.y) === 1,
          );
          playBattleCinematic(selected, target, mainDamage, "skill", () => {
            splashTargets.forEach((unit) => damageUnit(unit.id, 3, undefined, "skill"));
            setEventBanner("兄妹共鸣发动，星风连携撕开敌阵。");
            pushDialogue("塞缪尔", "伊索尔德，现在！");
            pushDialogue("伊索尔德", "星风会回应我们的！");
            pushLog(`塞缪尔与伊索尔德发动「星风连携」，对 ${target.name} 造成 ${mainDamage} 点伤害，并波及周围敌人。`);
          }, { combo: true, supportCaster: isolde, aura: "wind" });
        } else {
          const skillDamage = selected.atk + 2;
          playBattleCinematic(selected, target, skillDamage, "skill", () => {
            setEventBanner("塞缪尔的星辉斩逼退了前线敌军。");
            pushDialogue("塞缪尔", "别想越过这道防线。");
            pushLog(`塞缪尔发动「星辉斩」，对 ${target.name} 造成 ${skillDamage} 点伤害。`);
          }, { aura: "slash" });
        }
      } else {
        pushLog("塞缪尔的技能需要锁定敌方单位。");
        return;
      }
    }

    if (selected.id === "moon-deer") {
      const nearAllies = units.filter(
        (unit) => unit.team !== "enemy" && distance({ ...selected, x, y }, unit.x, unit.y) <= 1,
      );
      if (nearAllies.length === 0) {
        pushLog("月溪灵鹿周围没有可庇护的友军。");
        return;
      }
      const focusTarget = nearAllies[0] ?? selected;
      playBattleCinematic(selected, focusTarget, 0, "skill", () => {
        triggerFx(selected.id, "skill");
        nearAllies.forEach((ally) => triggerFx(ally.id, "heal", { value: 3, positive: true }));
        setUnits((prev) =>
          prev.map((unit) =>
            nearAllies.some((ally) => ally.id === unit.id)
              ? { ...unit, hp: Math.min(unit.maxHp, unit.hp + 3), acted: unit.id === selected.id ? true : unit.acted }
              : unit.id === selected.id
                ? { ...unit, acted: true }
                : unit,
          ),
        );
        setEventBanner("月溪灵鹿展开祝祷，治愈波纹覆盖阵线。");
        pushDialogue("月溪灵鹿", "呦鸣...（柔和的风环绕了所有同伴）");
        pushLog("月溪灵鹿展开「月溪祝祷」，为周围友军恢复 3 点生命。");
      }, { aura: "lunar" });
    }

    setMode("move");
  }

  function handleTileClick(x: number, y: number) {
    const unit = getUnit(x, y);

    if (!selected || turn !== "player" || battleState !== "ongoing" || selected.acted) {
      if (unit && unit.team !== "enemy") {
        setSelectedId(unit.id);
        pushLog(`已选中 ${unit.name}`);
      }
      return;
    }

    if (mode === "skill") {
      handleSkill(x, y, unit);
      return;
    }

    if (unit && unit.team !== "enemy") {
      setSelectedId(unit.id);
      pushLog(`已选中 ${unit.name}`);
      return;
    }

    if (unit && canAttack(unit)) {
      const bonus = selected.id === "samuel" && siblingBondActive ? 2 : 0;
      const totalDamage = selected.atk + bonus;
      playBattleCinematic(selected, unit, totalDamage, "attack", () => {
        markUnitActed(selected.id);
        setEventBanner(`${selected.name} 压制了 ${unit.name}。`);
        pushLog(`${selected.name} 攻击 ${unit.name}，造成 ${totalDamage} 点伤害。`);
        setMode("move");
      });
      return;
    }

    if (canMoveTo(x, y)) {
      {
        const travelTiles = Math.max(1, Math.abs(x - selected.x) + Math.abs(y - selected.y));
        const durationMs = baseRunDurationMs + travelTiles * runDurationPerTileMs;
        setMovementFx({
          unitId: selected.id,
          fromX: selected.x,
          fromY: selected.y,
          toX: x,
          toY: y,
          sprite: selected.runSprite,
          spriteSheet: selected.spriteSheet,
          spriteSheetCols: selected.spriteSheetCols,
          spriteSheetRows: selected.spriteSheetRows,
          spriteRow: selected.spriteAnims?.run?.row,
          spriteFrames: selected.spriteAnims?.run?.frames,
          spriteFps: selected.spriteAnims?.run?.fps,
          spritePresentation: {
            ...selected.spritePresentation,
            ...(selected.spritePresentation?.run ?? {}),
          },
          showcaseRunUrl: selected.showcase?.run?.url,
          durationMs,
          facing: x < selected.x ? "left" : "right",
          team: selected.team,
          name: selected.name,
        });
        window.setTimeout(() => setMovementFx(null), durationMs);
      }
      setUnits((prev) => prev.map((u) => (u.id === selected.id ? { ...u, x, y, moved: true } : u)));
      const terrain = terrainMap[y][x];
      setEventBanner(`${selected.name} 进入${terrainInfo[terrain].label}地形，仍可继续攻击或施法。`);
      pushLog(`${selected.name} 移动到 ${terrainInfo[terrain].label}地块 (${x}, ${y})。`);
    }
  }

  function enemyTurnStep() {
    if (battleState !== "ongoing") return;

    setUnits((currentUnits) => {
      const nextUnits = [...currentUnits];
      const allyCandidates = nextUnits.filter((unit) => unit.team !== "enemy");
      const enemyUnits = nextUnits.filter((unit) => unit.team === "enemy");
      let nextObjectiveHp = objectiveHp;
      const newLogs: string[] = [];
      let urgentBanner = "敌军正在推进。";

      for (const enemy of enemyUnits) {
        const currentEnemy = nextUnits.find((unit) => unit.id === enemy.id);
        if (!currentEnemy) continue;

        const target = allyCandidates
          .filter((ally) => ally.hp > 0)
          .sort((a, b) => {
            const scoreA = distance(currentEnemy, a.x, a.y) + (a.id === "isolde" ? -1 : 0);
            const scoreB = distance(currentEnemy, b.x, b.y) + (b.id === "isolde" ? -1 : 0);
            return scoreA - scoreB;
          })[0];

        if (!target) continue;

        const dist = distance(currentEnemy, target.x, target.y);
        if (dist === 1) {
          const targetIndex = nextUnits.findIndex((unit) => unit.id === target.id);
          if (targetIndex >= 0) {
            const targetUnit = nextUnits[targetIndex];
            triggerFx(currentEnemy.id, "attack");
            triggerFx(targetUnit.id, "hit", { value: currentEnemy.atk, positive: false });
            nextUnits[targetIndex] = { ...targetUnit, hp: targetUnit.hp - currentEnemy.atk };
            urgentBanner = `${currentEnemy.name} 正在猛攻 ${targetUnit.name}。`;
            newLogs.push(`${currentEnemy.name} 攻击 ${targetUnit.name}，造成 ${currentEnemy.atk} 点伤害。`);
          }
          continue;
        }

        const directions = [
          { x: currentEnemy.x + 1, y: currentEnemy.y },
          { x: currentEnemy.x - 1, y: currentEnemy.y },
          { x: currentEnemy.x, y: currentEnemy.y + 1 },
          { x: currentEnemy.x, y: currentEnemy.y - 1 },
        ].filter((pos) => clampToBoard(pos.x, pos.y));

        const bestStep = directions
          .filter((pos) => !nextUnits.some((unit) => unit.x === pos.x && unit.y === pos.y))
          .sort((a, b) => {
            const scoreA = Math.min(
              distance({ ...currentEnemy, x: a.x, y: a.y }, target.x, target.y),
              distance({ ...currentEnemy, x: a.x, y: a.y }, objectiveTile.x, objectiveTile.y),
            );
            const scoreB = Math.min(
              distance({ ...currentEnemy, x: b.x, y: b.y }, target.x, target.y),
              distance({ ...currentEnemy, x: b.x, y: b.y }, objectiveTile.x, objectiveTile.y),
            );
            return scoreA - scoreB;
          })[0];

        if (bestStep) {
          const enemyIndex = nextUnits.findIndex((unit) => unit.id === currentEnemy.id);
          nextUnits[enemyIndex] = { ...currentEnemy, x: bestStep.x, y: bestStep.y };
          newLogs.push(`${currentEnemy.name} 向防线逼近。`);
        }

        const projectedEnemy = nextUnits.find((unit) => unit.id === currentEnemy.id) ?? currentEnemy;
        if (distance(projectedEnemy, objectiveTile.x, objectiveTile.y) <= 2) {
          nextObjectiveHp -= 1;
          urgentBanner = "敌军正在冲击星隐乡外围结界。";
          newLogs.push(`${projectedEnemy.name} 冲击防线，星隐乡结界耐久下降 1 点。`);
        }
      }

      setObjectiveHp(Math.max(0, nextObjectiveHp));
      setEventBanner(urgentBanner);
      if (newLogs.length > 0) {
        setLog((prev) => [...newLogs.reverse(), ...prev].slice(0, 10));
      }

      return nextUnits.filter((unit) => unit.hp > 0);
    });

    setTurn("player");
    setTurnCount((prev) => prev + 1);
    setSelectedId(null);
    setMode("move");
    resetPlayerActions();
  }

  useEffect(() => {
    if (battleState !== "ongoing") return;

    if (objectiveHp <= 0 || !samuel || !isolde) {
      setBattleState("defeat");
      setEventBanner("防线崩溃，星隐乡外围失守。");
      pushDialogue("伊索尔德", "哥哥...结界撑不住了...");
      pushLog("防线崩溃，星隐乡外围失守。战斗失败。");
      return;
    }

    if (enemies.length === 0) {
      setBattleState("victory");
      setEventBanner("暗影先遣队已被击退，防线暂时稳住。");
      pushDialogue("塞缪尔", "暂时守住了，但这只是开始。");
      pushLog("暗影先遣队已被击退，星隐乡守卫战获胜。");
      return;
    }

    if (turnCount >= 6 && enemies.length > 0) {
      setUnits((prev) => {
        if (prev.some((unit) => unit.id === "shadow-reaver")) return prev;
        const reinforcement: Unit = {
          id: "shadow-reaver",
          name: "裂隙收割者",
          x: 8,
          y: 1,
          team: "enemy",
          hp: 18,
          maxHp: 18,
          atk: 6,
          role: "增援精英",
          moveRange: 2,
          desc: "第六回合登场的精英敌人，会强化正面压迫。",
        };
        return [...prev, reinforcement];
      });
      setEventBanner("新的暗影增援现身，战线压力骤增。");
      pushDialogue("伊索尔德", "又有新的黑雾波动，增援来了！");
      pushLog("第六回合：裂隙收割者加入战场。");
    }
  }, [objectiveHp, samuel, isolde, enemies.length, battleState, turnCount]);

  useEffect(() => {
    if (turn !== "enemy" || battleState !== "ongoing" || fullscreenBattleActive) return;
    const timer = window.setTimeout(() => {
      enemyTurnStep();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [turn, battleState, objectiveHp, fullscreenBattleActive]);

  useEffect(() => {
    if (!fullscreenBattleFx || !fullscreenBattleCanvasRef.current) return;

    let cancelled = false;
    let app: Application | null = null;

    const mount = async () => {
      app = new Application();
      await app.init({
        width: 1280,
        height: 720,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (cancelled || !fullscreenBattleCanvasRef.current || !app) return;

      fullscreenBattleCanvasRef.current.innerHTML = "";
      fullscreenBattleCanvasRef.current.appendChild(app.canvas);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";

      const stage = app.stage;
      const blur = new BlurFilter({ strength: 2 });

      const background = new Graphics()
        .rect(0, 0, 1280, 720)
        .fill({ color: 0x050816 });
      stage.addChild(background);

      const vignette = new Graphics()
        .rect(0, 0, 1280, 720)
        .fill({ color: 0x000000, alpha: 0.18 });
      vignette.filters = [blur];
      stage.addChild(vignette);

      const horizon = new Graphics()
        .roundRect(90, 470, 1100, 120, 48)
        .fill({ color: 0x0f172a, alpha: 0.95 });
      stage.addChild(horizon);

      const energyBand = new Graphics()
        .roundRect(120, 500, 1040, 12, 12)
        .fill({ color: fullscreenBattleFx.kind === "skill" ? 0x34d399 : 0x67e8f9, alpha: 0.7 });
      stage.addChild(energyBand);

      const flash = new Graphics().rect(0, 0, 1280, 720).fill({ color: 0xffffff, alpha: 0 });
      stage.addChild(flash);

      const attackerWrap = new Container();
      attackerWrap.position.set(280, 520);
      stage.addChild(attackerWrap);

      const supportWrap = new Container();
      supportWrap.position.set(150, 540);
      supportWrap.alpha = fullscreenBattleFx.supportCaster ? 0.88 : 0;
      supportWrap.visible = Boolean(fullscreenBattleFx.supportCaster);
      stage.addChild(supportWrap);

      const defenderWrap = new Container();
      defenderWrap.position.set(980, 520);
      stage.addChild(defenderWrap);

      const attackerShadow = new Graphics().ellipse(0, 0, 120, 26).fill({ color: 0x000000, alpha: 0.35 });
      attackerWrap.addChild(attackerShadow);
      const defenderShadow = new Graphics().ellipse(0, 0, 120, 26).fill({ color: 0x000000, alpha: 0.35 });
      defenderWrap.addChild(defenderShadow);
      const supportShadow = new Graphics().ellipse(0, 0, 90, 18).fill({ color: 0x000000, alpha: 0.22 });
      supportWrap.addChild(supportShadow);

      const attackerSprite = Sprite.from(fullscreenBattleFx.attacker.showcase?.attack?.url ?? fullscreenBattleFx.attacker.showcaseIdleUrl ?? fullscreenBattleFx.attacker.profilePortrait ?? fullscreenBattleFx.attacker.portrait ?? "/characters/samuel-profile-pic.png");
      attackerSprite.anchor.set(0.5, 1);
      attackerSprite.width = 290;
      attackerSprite.height = 370;
      attackerSprite.y = -10;
      attackerWrap.addChild(attackerSprite);

      const defenderSprite = Sprite.from(fullscreenBattleFx.defender.showcase?.hit?.url ?? fullscreenBattleFx.defender.showcaseIdleUrl ?? fullscreenBattleFx.defender.profilePortrait ?? fullscreenBattleFx.defender.portrait ?? "/characters/mutated-monster-profile-pic.png");
      defenderSprite.anchor.set(0.5, 1);
      defenderSprite.width = 290;
      defenderSprite.height = 370;
      defenderSprite.scale.x = -1;
      defenderSprite.y = -10;
      defenderWrap.addChild(defenderSprite);

      const supportSprite = fullscreenBattleFx.supportCaster
        ? Sprite.from(fullscreenBattleFx.supportCaster.showcase?.attack?.url ?? fullscreenBattleFx.supportCaster.showcaseIdleUrl ?? fullscreenBattleFx.supportCaster.profilePortrait ?? fullscreenBattleFx.supportCaster.portrait ?? "/characters/isolde-profile-pic.png")
        : null;
      if (supportSprite) {
        supportSprite.anchor.set(0.5, 1);
        supportSprite.width = 170;
        supportSprite.height = 240;
        supportSprite.y = -6;
        supportWrap.addChild(supportSprite);
      }

      const slash = new Graphics();
      slash.visible = false;
      stage.addChild(slash);

      const auraRibbon = new Graphics();
      auraRibbon.visible = false;
      stage.addChild(auraRibbon);

      const supportBurst = new Graphics();
      supportBurst.visible = false;
      stage.addChild(supportBurst);

      const impactRing = new Graphics();
      impactRing.visible = false;
      stage.addChild(impactRing);

      const labelStyle = new TextStyle({
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontSize: 26,
        fontWeight: '700',
        dropShadow: { alpha: 0.5, blur: 6, color: 0x000000, distance: 2 },
      });
      const minorStyle = new TextStyle({
        fill: 0x93c5fd,
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: '600',
      });
      const damageStyle = new TextStyle({
        fill: 0xfff1f2,
        fontFamily: 'Arial',
        fontSize: 72,
        fontWeight: '900',
        dropShadow: { alpha: 0.7, blur: 12, color: 0x7f1d1d, distance: 4 },
      });

      const attackerName = new Text({ text: fullscreenBattleFx.attacker.name, style: labelStyle });
      attackerName.position.set(90, 78);
      stage.addChild(attackerName);
      const attackerRole = new Text({ text: fullscreenBattleFx.attacker.role, style: minorStyle });
      attackerRole.position.set(92, 114);
      stage.addChild(attackerRole);

      const defenderName = new Text({ text: fullscreenBattleFx.defender.name, style: labelStyle });
      defenderName.anchor.set(1, 0);
      defenderName.position.set(1190, 78);
      stage.addChild(defenderName);
      const defenderRole = new Text({ text: fullscreenBattleFx.defender.role, style: minorStyle });
      defenderRole.anchor.set(1, 0);
      defenderRole.position.set(1188, 114);
      stage.addChild(defenderRole);

      const phaseText = new Text({
        text: fullscreenBattleFx.combo ? '星风连携' : fullscreenBattleFx.kind === 'skill' ? '奥义释放' : '正面交锋',
        style: new TextStyle({
          fill: fullscreenBattleFx.kind === 'skill' ? 0x86efac : 0x67e8f9,
          fontFamily: 'Arial',
          fontSize: 22,
          fontWeight: '800',
          letterSpacing: 2,
        }),
      });
      phaseText.anchor.set(0.5, 0);
      phaseText.position.set(640, 64);
      stage.addChild(phaseText);

      const damageText = new Text({ text: fullscreenBattleFx.damage > 0 ? `-${fullscreenBattleFx.damage}` : '+HEAL', style: damageStyle });
      damageText.anchor.set(0.5);
      damageText.position.set(920, 250);
      damageText.alpha = 0;
      stage.addChild(damageText);

      const overlayText = new Text({
        text: fullscreenBattleFx.kind === 'skill'
          ? fullscreenBattleFx.aura === 'lunar'
            ? '月华祝祷'
            : fullscreenBattleFx.damage === 0
              ? '治愈之风'
              : '力量正在凝聚'
          : '冲刺突进',
        style: new TextStyle({
          fill: 0xe2e8f0,
          fontFamily: 'Arial',
          fontSize: 20,
          fontWeight: '700',
        }),
      });
      overlayText.anchor.set(0.5);
      overlayText.position.set(640, 640);
      stage.addChild(overlayText);

      let elapsed = 0;
      const auraColor = fullscreenBattleFx.aura === 'wind' ? 0x86efac : fullscreenBattleFx.aura === 'lunar' ? 0xc4b5fd : 0x67e8f9;
      app.ticker.add((ticker) => {
        if (cancelled) return;
        elapsed += ticker.deltaMS;

        attackerWrap.x = elapsed < 380 ? 280 + Math.min(elapsed / 380, 1) * 200 : elapsed < 620 ? 480 : 460;
        attackerWrap.y = 520 - Math.sin(Math.min(elapsed, 620) / 620 * Math.PI) * (elapsed < 620 ? 34 : 0);

        if (supportWrap.visible && supportSprite) {
          supportWrap.x = 150 + Math.min(1, elapsed / 420) * 26;
          supportWrap.y = 540 - Math.sin(elapsed / 180) * 6;
          supportSprite.alpha = Math.min(1, 0.45 + elapsed / 500);
          supportSprite.rotation = Math.sin(elapsed / 240) * 0.02;
        }

        if (fullscreenBattleFx.kind === 'skill') {
          auraRibbon.visible = true;
          auraRibbon.clear();
          auraRibbon.moveTo(supportWrap.visible ? 215 : 350, 250 + Math.sin(elapsed / 120) * 10);
          auraRibbon.bezierCurveTo(420, 150, 630, 160 + Math.cos(elapsed / 160) * 16, 860, 265);
          auraRibbon.stroke({ width: fullscreenBattleFx.combo ? 16 : 10, color: auraColor, alpha: 0.22 + Math.min(0.28, elapsed / 1800), cap: 'round' });
        }

        if (elapsed > 420) {
          overlayText.text = fullscreenBattleFx.kind === 'skill' ? (fullscreenBattleFx.combo ? '双人协同爆发' : '能量爆发') : '命中瞬间';
          slash.visible = true;
          slash.clear();
          slash.moveTo(520, 230);
          slash.lineTo(820, 410);
          slash.stroke({ width: fullscreenBattleFx.kind === 'skill' ? 18 : 12, color: auraColor, alpha: 0.9, cap: 'round' });
          slash.alpha = Math.max(0, 1 - (elapsed - 420) / 240);

          if (supportWrap.visible) {
            supportBurst.visible = true;
            supportBurst.clear();
            supportBurst.circle(255, 290, 24 + Math.min(70, (elapsed - 420) / 2.2)).stroke({ width: 6, color: auraColor, alpha: Math.max(0, 0.6 - (elapsed - 420) / 420) });
          }
        }

        if (elapsed > 650) {
          flash.alpha = Math.max(0, 0.85 - (elapsed - 650) / 160);
          impactRing.visible = true;
          const ringScale = 1 + (elapsed - 650) / 120;
          impactRing.clear();
          impactRing.circle(940, 300, 70 * ringScale).stroke({ width: 8, color: 0xffffff, alpha: Math.max(0, 0.7 - (elapsed - 650) / 220) });
          if (fullscreenBattleFx.combo) {
            impactRing.circle(940, 300, 118 * ringScale).stroke({ width: 4, color: auraColor, alpha: Math.max(0, 0.5 - (elapsed - 650) / 260) });
          }
          defenderWrap.x = 980 + Math.sin((elapsed - 650) / 24) * 18;
          defenderWrap.rotation = Math.min(0.18, (elapsed - 650) / 1200);
          damageText.alpha = Math.min(1, (elapsed - 650) / 120);
          damageText.y = 250 - Math.min(70, (elapsed - 650) / 4);
          damageText.style.fill = fullscreenBattleFx.damage === 0
            ? fullscreenBattleFx.aura === 'lunar'
              ? [0xe9d5ff, 0xc4b5fd]
              : [0xdcfce7, 0x86efac]
            : fullscreenBattleFx.kind === 'skill'
              ? [0xdcfce7, 0x86efac]
              : [0xfff1f2, 0xfda4af];
          stage.x = Math.sin((elapsed - 650) / 20) * 9;
          stage.y = Math.cos((elapsed - 650) / 24) * 5;
        }

        if (elapsed > 980) {
          overlayText.text = fullscreenBattleFx.combo ? '连携收束' : '战斗结算中';
          stage.x *= 0.82;
          stage.y *= 0.82;
          defenderWrap.rotation *= 0.85;
          auraRibbon.alpha *= 0.92;
          supportBurst.alpha *= 0.9;
        }
      });
    };

    mount();

    return () => {
      cancelled = true;
      if (app) {
        app.destroy(true, { children: true });
      }
      if (fullscreenBattleCanvasRef.current) {
        fullscreenBattleCanvasRef.current.innerHTML = "";
      }
    };
  }, [fullscreenBattleFx]);

  useEffect(() => {
    return () => {
      if (screenFlashCleanupRef.current) {
        window.clearTimeout(screenFlashCleanupRef.current);
      }
      if (targetFocusCleanupRef.current) {
        window.clearTimeout(targetFocusCleanupRef.current);
      }
      if (attackerFocusCleanupRef.current) {
        window.clearTimeout(attackerFocusCleanupRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (turn === "player" && allPlayerActed && battleState === "ongoing") {
      setEventBanner("我方单位已全部行动，自动切换到敌方回合。");
      pushLog("我方单位已全部行动，自动结束回合。");
      const timer = window.setTimeout(() => {
        endTurn(true);
      }, 650);
      return () => window.clearTimeout(timer);
    }
  }, [allPlayerActed, turn, battleState]);

  function endTurn(auto = false) {
    if (battleState !== "ongoing") return;
    setSelectedId(null);
    setMode("move");
    setTurn("enemy");
    setEventBanner(auto ? "我方行动完成，敌军开始反扑。" : "我方回合结束，敌军开始反扑。");
    pushLog(auto ? "系统自动结束我方回合，敌方开始推进。" : "我方回合结束，敌方开始推进。");
  }

  function resetBattle() {
    setUnits(initialUnits.map((unit) => ({ ...unit, moved: false, acted: unit.team !== "enemy" ? false : unit.acted })));
    setSelectedId(null);
    setTurn("player");
    setMode("move");
    setBattleState("ongoing");
    setTurnCount(1);
    setObjectiveHp(12);
    setEventBanner("星隐乡外围告急，立即稳住防线。");
    setDialogue(buildInitialDialogue());
    setLog([
      "战斗开始：塞缪尔与伊索尔德必须守住星隐乡外围。",
      "提示：伊索尔德与月溪灵鹿相邻时，可发动治疗与风系支援。",
    ]);
    setCombatFx([]);
    setFxSeed(1);
    setMovementFx(null);
    setBattleCinematic(null);
    setFullscreenBattleFx(null);
  }

  const selectedTerrain = selected ? terrainMap[selected.y][selected.x] : null;

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <style jsx global>{`
        @keyframes battleHit {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
        @keyframes battleHeal {
          0% { transform: scale(1); filter: brightness(1); }
          40% { transform: scale(1.08); filter: brightness(1.35); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes battleReturn {
          0% { transform: scale(1.06) translateY(-4%); filter: brightness(1.1); }
          100% { transform: scale(1) translateY(0); filter: brightness(1); }
        }
        @keyframes floatNumber {
          0% { opacity: 0; transform: translate(-50%, -20%); }
          15% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -140%); }
        }
        @keyframes spriteRun {
          from { background-position: 0px 0px; }
          to { background-position: -1280px -1024px; }
        }
        @keyframes runAcrossTile {
          0% { transform: translate(var(--run-start-x), var(--run-start-y)) scale(1); }
          20% { transform: translate(calc(var(--run-end-x) * 0.2), calc(var(--run-end-y) * 0.2 - 4%)) scale(1.02); }
          50% { transform: translate(calc(var(--run-end-x) * 0.5), calc(var(--run-end-y) * 0.5 - 6%)) scale(1.04); }
          100% { transform: translate(var(--run-end-x), var(--run-end-y)) scale(1); }
        }
        @keyframes tokenRunBob {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10%) scale(1.08); }
        }
        @keyframes unitSpritePlay {
          from { background-position-x: 0%; }
          to { background-position-x: 114.2857%; }
        }
        @keyframes spriteFloatCenter {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -3%) scale(1.01); }
        }
        @keyframes impactFlash {
          0% { opacity: 0; transform: scale(0.7); }
          30% { opacity: 0.9; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes skillPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.94); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes focusSweep {
          0% { transform: translateX(-18%) scaleX(0.7); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translateX(105%) scaleX(1.08); opacity: 0; }
        }
      `}</style>
      <div className="mx-auto max-w-7xl">
        {screenFlash ? (
          <div
            className="pointer-events-none fixed inset-0 z-[85] animate-[impactFlash_0.28s_ease-out_forwards]"
            style={{
              background: screenFlash.kind === 'skill'
                ? screenFlash.aura === 'lunar'
                  ? 'radial-gradient(circle at center, rgba(196,181,253,0.35), rgba(15,23,42,0.02) 52%, transparent 72%)'
                  : 'radial-gradient(circle at center, rgba(110,231,183,0.32), rgba(15,23,42,0.02) 52%, transparent 72%)'
                : 'radial-gradient(circle at center, rgba(103,232,249,0.24), rgba(15,23,42,0.02) 50%, transparent 70%)',
            }}
          />
        ) : null}
        {fullscreenBattleActive ? (
          <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950/95 backdrop-blur-md">
            <div ref={fullscreenBattleCanvasRef} className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        ) : null}
        {battleCinematic ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/92 backdrop-blur-sm px-4">
            <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl items-end justify-between overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_rgba(2,6,23,0.95)_60%)] px-6 py-10 sm:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(255,255,255,0.06),transparent_40%)]" />
              <div className="absolute inset-x-0 bottom-[18%] h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
              {battleCinematic.videoEffect && battleCinematic.phase !== "run" ? (
                <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden rounded-3xl">
                  <video
                    key={battleCinematic.videoEffect}
                    className="h-full w-full object-contain mix-blend-screen opacity-90"
                    src={battleCinematic.videoEffect}
                    autoPlay
                    muted
                    playsInline
                    onEnded={() => {
                      setBattleCinematic(null);
                      if (cinematicCleanupRef.current) {
                        window.clearTimeout(cinematicCleanupRef.current);
                        cinematicCleanupRef.current = null;
                      }
                    }}
                  />
                </div>
              ) : null}
              {battleCinematic.phase === "impact" ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full bg-white/30 blur-xl animate-[impactFlash_0.45s_ease-out_forwards]" />
                </div>
              ) : null}
              {battleCinematic.kind === "skill" ? (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute left-[24%] bottom-[22%] h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl animate-[skillPulse_1.1s_ease-in-out_infinite]" />
                  <div className="absolute right-[18%] bottom-[28%] h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl animate-[skillPulse_1.2s_ease-in-out_infinite]" />
                </div>
              ) : null}
              <div className={`relative flex w-[42%] min-w-[150px] justify-center self-end transition-all duration-300 ${battleCinematic.phase === "run" ? "translate-x-[10%]" : battleCinematic.phase === "attack" ? "translate-x-[22%] scale-110" : "translate-x-[18%] scale-105"}`}>
                <div className="relative h-[44vh] w-full max-w-[320px] min-h-[220px]">
                  {safeCinematicAttackerSprite && !(battleCinematic.videoEffect && battleCinematic.attacker.id === "samuel" && battleCinematic.kind === "attack" && battleCinematic.phase !== "run") ? (
                    <div
                      className="absolute bottom-0 bg-no-repeat [image-rendering:pixelated]"
                      style={{
                        left: `${(safeCinematicAttackerSprite.presentation?.cinematicAnchorX ?? 0.5) * 100}%`,
                        width: `${(safeCinematicAttackerSprite.presentation?.cinematicWidth ?? 0.72) * 100}%`,
                        height: `${(safeCinematicAttackerSprite.presentation?.cinematicScale ?? 1) * 100}%`,
                        transform: `translateX(-${(safeCinematicAttackerSprite.presentation?.cinematicAnchorX ?? 0.5) * 100}%) translateY(${(safeCinematicAttackerSprite.presentation?.cinematicAnchorY ?? 0) * 100}%)`,
                        transformOrigin: 'center bottom',
                        backgroundImage: `url(${safeCinematicAttackerSprite.sheet})`,
                        backgroundSize: `${safeCinematicAttackerSprite.cols * 100}% ${safeCinematicAttackerSprite.rows * 100}%`,
                        backgroundPositionX: '0%',
                        backgroundPositionY: `${((safeCinematicAttackerSprite.row ?? 0) / Math.max(1, safeCinematicAttackerSprite.rows - 1)) * 100}%`,
                        filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.42))',
                        animation: `unitSpritePlay ${Math.max(0.35, (safeCinematicAttackerSprite.frames / Math.max(1, safeCinematicAttackerSprite.fps)))}s steps(${Math.max(1, safeCinematicAttackerSprite.frames - 1)}) infinite${battleCinematic.phase === "run" ? ', spriteFloatCenter 0.9s ease-in-out infinite' : ''}`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-contain bg-bottom bg-no-repeat" style={{ backgroundImage: `url(${battleCinematic.attacker.showcase?.attack?.url ?? battleCinematic.attacker.showcaseIdleUrl ?? battleCinematic.attacker.portrait})` }} />
                  )}
                </div>
              </div>
              <div className={`relative flex w-[38%] min-w-[140px] justify-center self-end transition-all duration-300 ${battleCinematic.phase === "impact" ? "scale-105 -translate-y-2" : ""}`}>
                <div className="relative h-[40vh] w-full max-w-[280px] min-h-[200px] scale-x-[-1]">
                  {safeCinematicDefenderSprite ? (
                    <div
                      className={`absolute bottom-0 bg-no-repeat [image-rendering:pixelated] ${battleCinematic.phase === "impact" ? "animate-[battleHit_0.45s_ease-in-out]" : ""}`}
                      style={{
                        left: `${(safeCinematicDefenderSprite.presentation?.cinematicAnchorX ?? 0.5) * 100}%`,
                        width: `${(safeCinematicDefenderSprite.presentation?.cinematicWidth ?? 0.72) * 100}%`,
                        height: `${(safeCinematicDefenderSprite.presentation?.cinematicScale ?? 1) * 100}%`,
                        transform: `translateX(-${(safeCinematicDefenderSprite.presentation?.cinematicAnchorX ?? 0.5) * 100}%) translateY(${(safeCinematicDefenderSprite.presentation?.cinematicAnchorY ?? 0) * 100}%)`,
                        transformOrigin: 'center bottom',
                        backgroundImage: `url(${safeCinematicDefenderSprite.sheet})`,
                        backgroundSize: `${safeCinematicDefenderSprite.cols * 100}% ${safeCinematicDefenderSprite.rows * 100}%`,
                        backgroundPositionX: '0%',
                        backgroundPositionY: `${((safeCinematicDefenderSprite.row ?? 0) / Math.max(1, safeCinematicDefenderSprite.rows - 1)) * 100}%`,
                        filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.42))',
                        animation: `unitSpritePlay ${Math.max(0.45, (safeCinematicDefenderSprite.frames / Math.max(1, safeCinematicDefenderSprite.fps)))}s steps(${Math.max(1, safeCinematicDefenderSprite.frames - 1)}) infinite`,
                      }}
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-contain bg-bottom bg-no-repeat ${battleCinematic.phase === "impact" ? "animate-[battleHit_0.45s_ease-in-out]" : ""}`} style={{ backgroundImage: `url(${battleCinematic.defender.showcase?.hit?.url ?? battleCinematic.defender.showcaseIdleUrl ?? battleCinematic.defender.portrait})` }} />
                  )}
                  {battleCinematic.phase === "impact" ? <div className="absolute inset-0 bg-white/20 mix-blend-screen" /> : null}
                </div>
              </div>
              <div className="absolute left-6 top-6 rounded-full border border-cyan-300/30 bg-slate-950/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200">
                {battleCinematic.kind === "skill" ? "Full Screen Skill" : "Full Screen Attack"}
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-center text-white shadow-2xl">
                <p className="text-sm text-cyan-100">{battleCinematic.attacker.name} → {battleCinematic.defender.name}</p>
                <p className="mt-1 text-2xl font-black tracking-wide">{battleCinematic.damage > 0 ? `-${battleCinematic.damage}` : 'HEAL'}</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mb-6 max-w-4xl space-y-3 sm:mb-8 sm:space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 sm:text-sm">Battle Prototype</p>
          <h1 className="text-3xl font-bold lg:text-6xl">星隐乡守卫战 Demo</h1>
          <p className="text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            这一版原型加入阶段对白、单位行动限制与更清晰的任务流反馈，让第一关开始具备剧情驱动的 SRPG 节奏。
          </p>
        </div>

        <div className="mb-4 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50 sm:text-base">
          {eventBanner}
        </div>

        {battleState !== "ongoing" ? (
          <div className={`mb-4 rounded-3xl border p-5 sm:p-6 ${battleState === "victory" ? "border-emerald-400/30 bg-emerald-400/10" : "border-rose-400/30 bg-rose-400/10"}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Level Result</p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  {battleState === "victory" ? "第一关完成，可进入试玩交付" : "第一关失败，请重新布阵"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
                  {battleState === "victory"
                    ? "星隐乡外围暂时守住，兄妹成功击退暗影先遣队。当前 Demo 已具备可试玩的一关结构，接下来主要是部署与少量收尾。"
                    : "当前失败会中断试玩节奏，但现在已经支持一键重开。后续还可以继续补失败后的引导和更平滑的重试体验。"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetBattle}
                  className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  再打一遍
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Mission Flow</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">第一关目标，守住星隐乡外围</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                击退暗影先遣队，保护兄妹与结界，并撑过敌方中盘增援。
              </p>
            </div>
            <div className="min-w-[220px] rounded-2xl bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-200">
                <span>关卡完成度</span>
                <span>{missionProgress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${missionProgress}%` }} />
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>• 已击退敌军: {defeatedEnemies}</p>
                <p>• 当前敌军: {enemies.length}</p>
                <p>• 据点耐久: {objectiveHp}/12</p>
                <p>• 当前状态: {battleState === "ongoing" ? "战斗进行中" : battleState === "victory" ? "已通关" : "失败待重试"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Main Objective</p>
            <p className="mt-3 text-lg font-semibold text-white">守住星隐乡外围，击退暗影使徒与异化凶兽突袭。</p>
          </div>
          <div className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-200">Sibling Bond</p>
            <p className="mt-3 text-lg font-semibold text-white">{siblingBondActive ? "兄妹相邻中，星风连携已就绪。" : "兄妹未形成联动站位。"}</p>
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Healing Link</p>
            <p className="mt-3 text-lg font-semibold text-white">{healingBondActive ? "伊索尔德与灵鹿共鸣，治疗强化。" : "灵鹿未与伊索尔德形成治疗共鸣。"}</p>
          </div>
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Barrier</p>
            <p className="mt-3 text-lg font-semibold text-white">结界耐久 {objectiveHp} / 12</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(400px,0.75fr)] lg:gap-8">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Turn {turnCount}</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {battleState === "victory"
                    ? "胜利"
                    : battleState === "defeat"
                      ? "失败"
                      : turn === "player"
                        ? "我方回合"
                        : "敌方回合"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode("move")}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${mode === "move" ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white"}`}
                >
                  移动模式
                </button>
                <button
                  onClick={() => setMode("attack")}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${mode === "attack" ? "bg-rose-400 text-slate-950" : "bg-white/10 text-white"}`}
                >
                  攻击模式
                </button>
                <button
                  onClick={() => setMode("skill")}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${mode === "skill" ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-white"}`}
                >
                  技能模式
                </button>
                <button
                  onClick={() => endTurn()}
                  disabled={turn !== "player" || battleState !== "ongoing"}
                  className="min-h-11 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 sm:px-5"
                >
                  结束回合
                </button>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible pb-16">
              <div className="relative min-w-[440px] sm:min-w-[560px]">
                {movementFx ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-30 overflow-visible"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute overflow-visible"
                      style={{
                        left: `calc(${movementFx.fromX} * (100% / ${mapCols}) + 0.375rem)`,
                        top: `calc(${movementFx.fromY} * (100% / ${mapRows}) + 0.375rem)`,
                        width: `calc((100% / ${mapCols} - 0.75rem) * ${runSpriteScale})`,
                        height: `calc((100% / ${mapRows} - 0.75rem) * ${runSpriteScale})`,
                        marginLeft: `calc((100% / ${mapCols} - 0.75rem) * -${(runSpriteScale - 1) / 2})`,
                        marginTop: `calc((100% / ${mapRows} - 0.75rem) * -${runSpriteScale - 1})`,
                        transform: movementFx.facing === "left" ? 'scaleX(-1)' : undefined,
                        transformOrigin: 'center bottom',
                      }}
                    >
                      {movementFx.sprite ? (
                        <div
                          className="h-full w-full bg-no-repeat [image-rendering:pixelated] drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
                          style={{
                            backgroundImage: `url(${movementFx.sprite})`,
                            backgroundSize: `${spriteSheetColumns * 100}% ${spriteSheetRows * 100}%`,
                            backgroundPosition: '0 0',
                            ['--run-start-x' as string]: '0%',
                            ['--run-start-y' as string]: '0%',
                            ['--run-end-x' as string]: `${(movementFx.toX - movementFx.fromX) * (100 / runSpriteScale)}%`,
                            ['--run-end-y' as string]: `${(movementFx.toY - movementFx.fromY) * (100 / runSpriteScale)}%`,
                            animation: `spriteRun ${movementFx.durationMs}ms steps(${spriteFrameCount}) infinite, runAcrossTile ${movementFx.durationMs}ms linear forwards`,
                          }}
                        />
                      ) : movementFx.spriteSheet && movementFx.spriteSheetCols && movementFx.spriteSheetRows ? (
                        <div
                          className="absolute bottom-0 bg-no-repeat [image-rendering:pixelated]"
                          style={{
                            left: `${(movementFx.spritePresentation?.mapAnchorX ?? 0.5) * 100}%`,
                            width: `${(movementFx.spritePresentation?.mapWidth ?? 0.72) * 100}%`,
                            height: `${(movementFx.spritePresentation?.mapScale ?? 1) * 100}%`,
                            transform: `translateX(-${(movementFx.spritePresentation?.mapAnchorX ?? 0.5) * 100}%) translateY(${(movementFx.spritePresentation?.mapAnchorY ?? 0) * 100}%)`,
                            transformOrigin: 'center bottom',
                            backgroundImage: `url(${movementFx.spriteSheet})`,
                            backgroundSize: `${movementFx.spriteSheetCols * 100}% ${movementFx.spriteSheetRows * 100}%`,
                            backgroundPositionX: '0%',
                            backgroundPositionY: `${((movementFx.spriteRow ?? 0) / Math.max(1, movementFx.spriteSheetRows - 1)) * 100}%`,
                            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))',
                            ['--run-start-x' as string]: '0%',
                            ['--run-start-y' as string]: '0%',
                            ['--run-end-x' as string]: `${(movementFx.toX - movementFx.fromX) * (100 / runSpriteScale)}%`,
                            ['--run-end-y' as string]: `${(movementFx.toY - movementFx.fromY) * (100 / runSpriteScale)}%`,
                            animation: `unitSpritePlay ${Math.max(0.35, (movementFx.spriteFrames ?? 8) / Math.max(1, movementFx.spriteFps ?? 10))}s steps(${Math.max(1, (movementFx.spriteFrames ?? 8) - 1)}) infinite, runAcrossTile ${movementFx.durationMs}ms linear forwards`,
                          }}
                        />
                      ) : movementFx.showcaseRunUrl ? (
                        <div
                          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${movementFx.showcaseRunUrl})`,
                            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))',
                            ['--run-start-x' as string]: '0%',
                            ['--run-start-y' as string]: '0%',
                            ['--run-end-x' as string]: `${(movementFx.toX - movementFx.fromX) * (100 / runSpriteScale)}%`,
                            ['--run-end-y' as string]: `${(movementFx.toY - movementFx.fromY) * (100 / runSpriteScale)}%`,
                            animation: `runAcrossTile ${movementFx.durationMs}ms ease-in-out forwards, tokenRunBob 220ms ease-in-out infinite`,
                            transform: `scaleX(${movementFx.facing === "left" ? -1 : 1})`,
                          }}
                        />
                      ) : (
                        <div
                          className={`relative flex h-full w-full items-end justify-center rounded-[28%] border-2 text-[10px] font-black tracking-wide shadow-2xl ${teamClass(movementFx.team)} ${movementFx.team === "enemy" ? "border-rose-200/60" : movementFx.team === "beast" ? "border-violet-200/60" : "border-cyan-100/70"}`}
                          style={{
                            ['--run-start-x' as string]: '0%',
                            ['--run-start-y' as string]: '0%',
                            ['--run-end-x' as string]: `${(movementFx.toX - movementFx.fromX) * (100 / runSpriteScale)}%`,
                            ['--run-end-y' as string]: `${(movementFx.toY - movementFx.fromY) * (100 / runSpriteScale)}%`,
                            animation: `runAcrossTile ${movementFx.durationMs}ms ease-in-out forwards, tokenRunBob 220ms ease-in-out infinite`,
                          }}
                        >
                          <div className="absolute inset-0 rounded-[28%] bg-gradient-to-t from-black/35 to-white/10" />
                          <span className="relative z-10 mb-2 rounded bg-black/45 px-2 py-1 text-white">
                            {movementFx.name.slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
                {attackerFocus && targetFocus && focusLineMetrics ? (
                  <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
                    <div
                      className="absolute origin-left rounded-full overflow-hidden"
                      style={{
                        left: `calc(${attackerFocus.x} * (100% / ${mapCols}) + (100% / ${mapCols}) * 0.5)`,
                        top: `calc(${attackerFocus.y} * (100% / ${mapRows}) + (100% / ${mapRows}) * 0.5)`,
                        width: `calc(${focusLineMetrics.distance} * min(100% / ${mapCols}, 100% / ${mapRows}))`,
                        height: attackerFocus.phase === 'charge' ? '4px' : '6px',
                        background: attackerFocus.aura === 'lunar'
                          ? 'linear-gradient(90deg, rgba(196,181,253,0.15), rgba(196,181,253,0.95))'
                          : attackerFocus.kind === 'skill'
                            ? 'linear-gradient(90deg, rgba(110,231,183,0.15), rgba(110,231,183,0.95))'
                            : 'linear-gradient(90deg, rgba(103,232,249,0.15), rgba(103,232,249,0.95))',
                        transform: `rotate(${focusLineMetrics.angle}rad)`,
                        boxShadow: attackerFocus.phase === 'charge'
                          ? '0 0 10px rgba(255,255,255,0.12)'
                          : '0 0 18px rgba(255,255,255,0.22)',
                        opacity: attackerFocus.phase === 'charge' ? 0.6 : 0.92,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 w-[32%] rounded-full bg-white/80 blur-[1px]"
                        style={{
                          animation: attackerFocus.phase === 'release' ? 'focusSweep 0.42s ease-out 1' : 'none',
                          opacity: attackerFocus.phase === 'release' ? 1 : 0,
                        }}
                      />
                    </div>
                    <div
                      className={`absolute rounded-full ${attackerFocus.phase === 'charge' ? 'animate-pulse' : 'animate-ping'}`}
                      style={{
                        left: `calc(${targetFocus.x} * (100% / ${mapCols}) + (100% / ${mapCols}) * 0.5 - 8px)`,
                        top: `calc(${targetFocus.y} * (100% / ${mapRows}) + (100% / ${mapRows}) * 0.5 - 8px)`,
                        width: '16px',
                        height: '16px',
                        border: targetFocus.aura === 'lunar'
                          ? '2px solid rgba(196,181,253,0.95)'
                          : targetFocus.kind === 'skill'
                            ? '2px solid rgba(110,231,183,0.95)'
                            : '2px solid rgba(103,232,249,0.95)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      }}
                    />
                  </div>
                ) : null}
                <div
                  className="grid gap-1 sm:gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${mapCols}, minmax(${mobileTileSize}px, ${desktopTileSize}px))`,
                    gridAutoRows: `minmax(${mobileTileSize}px, ${desktopTileSize}px)`,
                  }}
                >
                  {Array.from({ length: mapRows * mapCols }).map((_, index) => {
                    const x = index % mapCols;
                    const y = Math.floor(index / mapCols);
                    const unit = getUnit(x, y);
                    const terrain = terrainMap[y][x];
                    const movable = canMoveTo(x, y);
                    const attackable = unit ? canAttack(unit) : false;
                    const skillable = canUseSkill(x, y);
                    const isObjective = x === objectiveTile.x && y === objectiveTile.y;
                    const unitFx = unit ? fxByUnit[unit.id] ?? [] : [];
                    const attackerFx = unitFx.some((fx) => fx.kind === "attack" || fx.kind === "skill");
                    const hitFx = unitFx.some((fx) => fx.kind === "hit");
                    const healFx = unitFx.some((fx) => fx.kind === "heal");
                    const returnFx = unitFx.some((fx) => fx.kind === "return");
                    const unitVisualUrl = unit
                      ? attackerFx
                        ? unit.showcase?.attack?.url ?? unit.showcaseIdleUrl
                        : hitFx
                          ? unit.showcase?.hit?.url ?? unit.showcaseIdleUrl
                          : unit.showcaseIdleUrl
                      : undefined;
                    const focusFx = Boolean(targetFocus && targetFocus.x === x && targetFocus.y === y);
                    const attackerPrepFx = Boolean(unit && attackerFocus?.unitId === unit.id);
                    const unitSprite = unit
                      ? getUnitSpriteState(unit, {
                          selected: selected?.id === unit.id,
                          moving: movementFx?.unitId === unit.id,
                          attacking: attackerFx,
                          healing: healFx,
                        })
                      : null;

                    return (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => handleTileClick(x, y)}
                        className={`flex items-center justify-center rounded-xl border text-[10px] font-semibold transition sm:rounded-2xl sm:text-xs ${
                          unit
                            ? `${teamClass(unit.team)} border-white/10 ${unit.team !== "enemy" && unit.acted ? "opacity-55" : ""}`
                            : movable
                              ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                              : terrainInfo[terrain].className
                        } ${attackable ? "ring-4 ring-rose-300/60" : ""} ${skillable ? "ring-4 ring-emerald-300/50" : ""} ${selected?.x === x && selected?.y === y ? "ring-4 ring-cyan-200/60" : ""} ${focusFx ? targetFocus?.aura === "lunar" ? "ring-4 ring-violet-300/70" : targetFocus?.kind === "skill" ? "ring-4 ring-emerald-200/70" : "ring-4 ring-cyan-200/70" : ""} ${isObjective ? "outline outline-2 outline-amber-300/80" : ""}`}
                        title={`${terrainInfo[terrain].label} - ${terrainInfo[terrain].desc}`}
                        style={{
                          width: `${mobileTileSize}px`,
                          height: `${mobileTileSize}px`,
                        }}
                      >
                        {unit ? (
                          <div className={`relative h-full w-full overflow-visible rounded-[inherit] transition-transform duration-300 ${attackerFx ? "scale-110 -translate-y-1" : ""} ${hitFx ? "animate-[battleHit_0.45s_ease-in-out]" : ""} ${healFx ? "animate-[battleHeal_0.7s_ease-out]" : ""} ${returnFx ? "animate-[battleReturn_0.52s_ease-out]" : ""} ${attackerPrepFx ? attackerFocus?.phase === "charge" ? "scale-105 -translate-y-1" : "scale-110 -translate-y-1" : ""} ${movementFx?.unitId === unit.id && !unit.spriteSheet ? "opacity-0" : ""}`}>
                            {unitSprite ? (
                              <div
                                className="absolute left-0 right-0 bottom-0 overflow-visible sm:[height:150%]"
                                style={{ height: '170%' }}
                              >
                                <div
                                  className="absolute bottom-0 bg-no-repeat [image-rendering:pixelated]"
                                  style={{
                                    left: `${(unitSprite.presentation?.mapAnchorX ?? 0.5) * 100}%`,
                                    width: `${(unitSprite.presentation?.mapWidth ?? 0.72) * 100}%`,
                                    height: `${(unitSprite.presentation?.mapScale ?? 1) * 100}%`,
                                    transform: `translateX(-${(unitSprite.presentation?.mapAnchorX ?? 0.5) * 100}%) translateY(${(unitSprite.presentation?.mapAnchorY ?? 0) * 100}%)`,
                                    transformOrigin: 'center bottom',
                                    backgroundImage: `url(${unitSprite.sheet})`,
                                    backgroundSize: `${unitSprite.cols * 100}% ${unitSprite.rows * 100}%`,
                                    backgroundPositionX: "0%",
                                    backgroundPositionY: `${(unitSprite.row / Math.max(1, unitSprite.rows - 1)) * 100}%`,
                                    filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.38))',
                                    animation: unitSprite.frames > 1 ? `unitSpritePlay ${Math.max(0.4, unitSprite.frames / unitSprite.fps)}s steps(${Math.max(1, unitSprite.frames - 1)}) infinite, spriteFloatCenter 1.4s ease-in-out infinite` : 'spriteFloatCenter 1.8s ease-in-out infinite',
                                  }}
                                />
                              </div>
                            ) : unitVisualUrl ? (
                              <div
                                className={`absolute left-0 right-0 bottom-0 bg-contain bg-bottom bg-no-repeat ${attackerFx ? 'scale-105 -translate-y-1' : hitFx ? 'animate-[battleHit_0.45s_ease-in-out]' : ''}`}
                                style={{ backgroundImage: `url(${unitVisualUrl})`, height: '170%', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.38))' }}
                              />
                            ) : unit.portrait ? (
                              <div
                                className="absolute left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${unit.portrait})`, height: '170%' }}
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {attackerFx ? <div className="absolute inset-0 bg-cyan-300/25" /> : null}
                            {attackerPrepFx ? <div className={`absolute inset-0 rounded-[inherit] ${attackerFocus?.aura === "lunar" ? "bg-violet-200/12" : attackerFocus?.kind === "skill" ? "bg-emerald-200/12" : "bg-cyan-100/12"} ${attackerFocus?.phase === "charge" ? "animate-pulse" : "animate-ping"}`} /> : null}
                            {hitFx ? <div className="absolute inset-0 bg-rose-300/35 animate-pulse" /> : null}
                            {healFx ? <div className="absolute inset-0 bg-emerald-300/30" /> : null}
                            {returnFx ? <div className="absolute inset-0 rounded-[inherit] border border-cyan-200/40 bg-cyan-200/8" /> : null}
                            {focusFx ? <div className={`absolute inset-0 rounded-[inherit] ${targetFocus?.aura === "lunar" ? "bg-violet-300/16" : targetFocus?.kind === "skill" ? "bg-emerald-300/14" : "bg-cyan-200/12"} ${targetFocus?.phase === "lock" ? "animate-ping" : "animate-pulse"}`} /> : null}
                            <div className="absolute left-1 top-1 rounded bg-black/65 px-1 text-[9px] text-white">
                              {unit.name.slice(0, 2)}
                            </div>
                            {attackerPrepFx ? (
                              <div className="absolute inset-x-1 top-5 rounded bg-black/70 px-1 py-0.5 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white">
                                {attackerFocus?.phase === "charge" ? "CHARGING" : "RELEASING"}
                              </div>
                            ) : null}
                            <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[9px] text-white">
                              {unit.hp}
                            </div>
                            {focusFx ? (
                              <div className="absolute inset-x-1 bottom-5 rounded bg-black/70 px-1 py-0.5 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white">
                                {targetFocus?.phase === "lock"
                                  ? "LOCKING"
                                  : targetFocus?.kind === "skill"
                                    ? (targetFocus?.aura === "lunar" ? "HEAL TARGET" : "SKILL TARGET")
                                    : "ATTACK TARGET"}
                              </div>
                            ) : null}
                            <div className="pointer-events-none absolute inset-0 overflow-visible">
                              {unitFx.map((fx) =>
                                fx.value ? (
                                  <div
                                    key={fx.id}
                                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-extrabold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] animate-[floatNumber_0.8s_ease-out_forwards] ${fx.positive ? "text-emerald-200" : "text-rose-100"}`}
                                  >
                                    {fx.positive ? `+${fx.value}` : `-${fx.value}`}
                                  </div>
                                ) : null,
                              )}
                            </div>
                          </div>
                        ) : isObjective ? "据点" : terrainInfo[terrain].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <div className="grid gap-3">
              {playerUnits.map((unit) => (
                <div key={unit.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  {unit.showcaseIdleUrl ? (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-300/15 bg-slate-950/55">
                      <div
                        className="h-40 w-full bg-no-repeat bg-left-top object-contain [image-rendering:pixelated]"
                        style={{
                          backgroundImage: `url(${unit.showcaseIdleUrl})`,
                          backgroundSize: `${Math.max(1, unit.showcase?.idle?.columns ?? unit.showcase?.idle?.frameCount ?? 1) * 100}% ${Math.max(1, unit.showcase?.idle?.rows ?? 1) * 100}%`,
                          animation: (unit.showcase?.idle?.frameCount ?? 1) > 1
                            ? `unitSpritePlay ${Math.max(0.4, (unit.showcase?.idle?.frameCount ?? 4) / Math.max(1, unit.showcase?.idle?.fps ?? 8))}s steps(${Math.max(1, (unit.showcase?.idle?.frameCount ?? 4) - 1)}) infinite`
                            : undefined,
                        }}
                      />
                      <div className="border-t border-white/10 px-3 py-2 text-[11px] text-emerald-100/90">
                        {unit.showcaseSourceLabel} · 当前用于该角色待机展示{unit.showcaseJobId ? ` · ${unit.showcaseJobId}` : ''}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{unit.name}</p>
                      <p className="text-sm text-cyan-200">{unit.role}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${teamClass(unit.team)}`}>{unit.team === "beast" ? "魔兽" : unit.acted ? "已行动" : "待命"}</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{unit.desc}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>HP {unit.hp}/{unit.maxHp}</span>
                    <span>ATK {unit.atk} · MOV {unit.moveRange}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">阶段对白</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                {dialogue.map((item, index) => (
                  <div key={`${item.speaker}-${index}`} className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{item.speaker}</p>
                    <p className="mt-2">{item.line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">关卡状态</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                <p>• 胜利条件：击退全部敌军</p>
                <p>• 失败条件：塞缪尔或伊索尔德倒下，或结界耐久归零</p>
                <p>• 第 6 回合会出现新的暗影增援</p>
                <p>• 每名友军每回合仅可行动一次</p>
                <p>• 当全部友军已行动时，系统会自动结束回合</p>              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">当前选中</p>
              <p className="mt-3 text-lg font-semibold text-white">{selected ? selected.name : "未选中单位"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                {selected
                  ? `${selected.role} · HP ${selected.hp}/${selected.maxHp} · 攻击 ${selected.atk} · 移动 ${selected.moveRange}`
                  : "先点击塞缪尔、伊索尔德或月溪灵鹿，再进行行动。"}
              </p>
              {selected ? <p className="mt-2 text-sm text-slate-400">{selected.desc}</p> : null}
              {selectedTerrain ? (
                <p className="mt-3 text-sm text-emerald-200">
                  当前地形：{terrainInfo[selectedTerrain].label}，{terrainInfo[selectedTerrain].desc}
                </p>
              ) : null}
            </div>

            {selected ? (
              <div className="fixed bottom-4 left-4 z-[80] w-[170px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/85 shadow-2xl backdrop-blur sm:w-[210px]">
                <div className="relative h-[210px] w-full sm:h-[260px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${selected.showcaseIdleUrl ?? selected.profilePortrait ?? selected.portrait})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-cyan-300/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950">
                    Selected
                  </div>
                  {selected.showcaseSourceLabel ? (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-300/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-950">
                      {selected.showcaseSourceLabel}
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p className="text-base font-bold sm:text-lg">{selected.name}</p>
                    <p className="text-xs text-cyan-100 sm:text-sm">{selected.role}</p>
                    <p className="mt-2 text-xs text-slate-200">HP {selected.hp}/{selected.maxHp} · ATK {selected.atk}</p>
                    <p className="mt-2 text-[11px] text-slate-300">
                      {selected.showcaseIdleUrl ? `已自动应用该角色待机动画${(selected.showcase?.idle?.frameCount ?? 1) > 1 ? ` · ${(selected.showcase?.idle?.frameCount ?? 1)} 帧` : ''}` : '当前仍使用角色静态立绘'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">战斗日志</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {log.map((item, index) => (
                  <p key={`${item}-${index}`}>• {item}</p>
                ))}
              </div>
            </div>

            <button
              onClick={resetBattle}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              重置战斗
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
