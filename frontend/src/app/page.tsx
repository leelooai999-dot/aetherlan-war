export default function Home() {
  const heroes = [
    {
      name: '塞缪尔·艾利奥特',
      role: '符文剑士 / 星辉守护者',
      desc: '沉稳坚毅的长子，擅长符文剑术与守护魔法，与星翼猎狮共鸣作战。',
    },
    {
      name: '伊索尔德·艾利奥特',
      role: '风语术师 / 星月灵愈使',
      desc: '灵动的少女魔法师，精于风系与治愈魔法，是队伍的治疗与控场核心。',
    },
    {
      name: '雷欧纳德·索恩',
      role: '铁壁骑士 / 大地战将',
      desc: '热血直率的王国战士，拥有强大的冲锋与守阵能力。',
    },
    {
      name: '莉奥拉·月影',
      role: '月影游侠 / 森灵追猎者',
      desc: '来自精灵森林的少女，擅长追踪、突袭与自然魔法。',
    },
  ];

  const pillars = [
    '双主角叙事与长线成长',
    '人与魔兽的共鸣战斗系统',
    '100关高幻想远征地图',
    '元素地形、羁绊与连携奥义',
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e2a78,_#0b1024_55%,_#050816)] text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-10">
        <div className="max-w-4xl space-y-6">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
            Web SRPG Project • 高画质策略战棋
          </span>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight lg:text-7xl">
              埃瑟兰战记：<span className="text-cyan-300">星尘之绊</span>
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-200 lg:text-xl">
              在星隐乡的屏障崩裂之后，兄妹与伙伴们踏上横跨四国的远征，追查暗影裂隙复苏的真相。
              这是一款面向网页端打造的高幻想、高演出、长篇章策略战棋游戏。
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="#heroes"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              查看主角团
            </a>
            <a
              href="#vision"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 transition hover:border-cyan-200 hover:text-cyan-200"
            >
              项目定位
            </a>
            <a
              href="/lore"
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              世界观设定
            </a>
            <a
              href="/prototype"
              className="rounded-full border border-violet-300/30 bg-violet-400/10 px-6 py-3 font-semibold text-violet-100 transition hover:bg-violet-400/20"
            >
              战棋原型
            </a>
          </div>
        </div>

        <div id="vision" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300">Core Pillar</div>
              <p className="text-lg font-medium text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="heroes" className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-14">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Main Cast</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">主角团与远征核心成员</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {heroes.map((hero) => (
            <article
              key={hero.name}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-6 shadow-2xl shadow-cyan-950/10"
            >
              <div className="mb-3 text-sm text-cyan-300">{hero.role}</div>
              <h3 className="text-2xl font-semibold text-white">{hero.name}</h3>
              <p className="mt-4 leading-7 text-slate-200">{hero.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
