"use client";

import { useMemo, useState } from "react";

type Team = "player" | "enemy" | "beast";
type Mode = "move" | "attack";

type Unit = {
  id: string;
  name: string;
  x: number;
  y: number;
  team: Team;
  hp: number;
  atk: number;
};

const mapRows = 8;
const mapCols = 10;
const initialUnits: Unit[] = [
  { id: "samuel", name: "塞缪尔", x: 1, y: 5, team: "player", hp: 18, atk: 6 },
  { id: "isolde", name: "伊索尔德", x: 2, y: 6, team: "player", hp: 14, atk: 4 },
  { id: "lion", name: "星翼猎狮", x: 2, y: 5, team: "beast", hp: 16, atk: 5 },
  { id: "wolf", name: "狂暴狼兽", x: 7, y: 2, team: "enemy", hp: 12, atk: 4 },
  { id: "apostle", name: "暗影使徒", x: 8, y: 4, team: "enemy", hp: 15, atk: 5 },
];

function teamClass(team: Team) {
  if (team === "player") return "bg-cyan-400 text-slate-950";
  if (team === "beast") return "bg-violet-400 text-white";
  return "bg-rose-500 text-white";
}

export default function PrototypePage() {
  const [units, setUnits] = useState(initialUnits);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [turn, setTurn] = useState<"player" | "enemy">("player");
  const [mode, setMode] = useState<Mode>("move");
  const [log, setLog] = useState<string[]>(["战斗开始：请选择我方单位行动"]);

  const selected = useMemo(() => units.find((u) => u.id === selectedId) ?? null, [units, selectedId]);

  function getUnit(x: number, y: number) {
    return units.find((unit) => unit.x === x && unit.y === y);
  }

  function distance(a: Unit, x: number, y: number) {
    return Math.abs(a.x - x) + Math.abs(a.y - y);
  }

  function canMoveTo(x: number, y: number) {
    if (!selected || turn !== "player" || mode !== "move") return false;
    if (getUnit(x, y)) return false;
    return distance(selected, x, y) === 1;
  }

  function canAttack(unit: Unit) {
    if (!selected || turn !== "player" || mode !== "attack") return false;
    if (unit.team !== "enemy") return false;
    return distance(selected, unit.x, unit.y) === 1;
  }

  function handleTileClick(x: number, y: number) {
    const unit = getUnit(x, y);

    if (unit && unit.team !== "enemy") {
      setSelectedId(unit.id);
      setMode("move");
      setLog((prev) => [`已选中 ${unit.name}`, ...prev].slice(0, 6));
      return;
    }

    if (!selected || turn !== "player") return;

    if (unit && canAttack(unit)) {
      const nextUnits = units
        .map((u) => (u.id === unit.id ? { ...u, hp: u.hp - selected.atk } : u))
        .filter((u) => u.hp > 0);
      setUnits(nextUnits);
      setLog((prev) => [`${selected.name} 攻击 ${unit.name}，造成 ${selected.atk} 点伤害`, ...prev].slice(0, 6));
      setMode("move");
      return;
    }

    if (canMoveTo(x, y)) {
      setUnits((prev) => prev.map((u) => (u.id === selected.id ? { ...u, x, y } : u)));
      setLog((prev) => [`${selected.name} 移动到 (${x}, ${y})`, ...prev].slice(0, 6));
    }
  }

  function endTurn() {
    setSelectedId(null);
    setMode("move");
    setTurn((prev) => (prev === "player" ? "enemy" : "player"));
    setLog((prev) => [`回合结束，切换为${turn === "player" ? "敌方" : "我方"}行动`, ...prev].slice(0, 6));
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 max-w-3xl space-y-3 sm:mb-8 sm:space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 sm:text-sm">Battle Prototype</p>
          <h1 className="text-3xl font-bold lg:text-6xl">战棋原型演示</h1>
          <p className="text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            当前版本支持基础选中、移动、近战攻击与回合切换，持续朝可玩的网页SRPG Demo推进。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-8">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Current Turn</p>
                <p className="mt-1 text-lg font-semibold text-white">{turn === "player" ? "我方回合" : "敌方回合"}</p>
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
                  onClick={endTurn}
                  className="min-h-11 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:px-5"
                >
                  结束回合
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${mapCols}, minmax(0, 1fr))` }}>
                  {Array.from({ length: mapRows * mapCols }).map((_, index) => {
                    const x = index % mapCols;
                    const y = Math.floor(index / mapCols);
                    const unit = getUnit(x, y);
                    const movable = canMoveTo(x, y);
                    const attackable = unit ? canAttack(unit) : false;

                    return (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => handleTileClick(x, y)}
                        className={`flex min-h-10 aspect-square items-center justify-center rounded-xl border text-[10px] font-semibold transition sm:rounded-2xl sm:text-xs ${
                          unit
                            ? `${teamClass(unit.team)} border-white/10`
                            : movable
                              ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                              : "border-white/5 bg-slate-800/80 text-slate-500"
                        } ${attackable ? "ring-4 ring-rose-300/60" : ""} ${selected?.x === x && selected?.y === y ? "ring-4 ring-cyan-200/60" : ""}`}
                      >
                        {unit ? `${unit.name.slice(0, 2)}\n${unit.hp}` : `${x},${y}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <div>
              <h2 className="text-xl font-semibold text-cyan-200 sm:text-2xl">Demo 状态</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300 sm:text-base">
                <li>• 已支持移动模式与攻击模式切换</li>
                <li>• 敌方单位显示生命值</li>
                <li>• 手机触屏按钮尺寸已放大</li>
                <li>• 小屏与桌面布局均可用</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">当前选中</p>
              <p className="mt-3 text-lg font-semibold text-white">{selected ? selected.name : "未选中单位"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                {selected
                  ? `HP ${selected.hp} / 攻击 ${selected.atk} / 当前位置 (${selected.x}, ${selected.y})`
                  : "先点击塞缪尔、伊索尔德或星翼猎狮，再进行行动。"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 sm:text-sm">战斗日志</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {log.map((item, index) => (
                  <p key={`${item}-${index}`}>• {item}</p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
