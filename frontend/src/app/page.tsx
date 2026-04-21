const heroes = [
  {
    name: '塞缪尔·艾利奥特',
    role: '符文剑士 / 星辉守护者',
    desc: '沉稳坚毅的长子，始终站在前线，为妹妹与同伴扛住裂隙来袭的第一波冲击。',
  },
  {
    name: '伊索尔德·艾利奥特',
    role: '风语术师 / 星月灵愈使',
    desc: '17 岁的妹妹，继承了风系与治愈天赋，与月溪灵鹿并肩作战，是队伍的移动治愈核心。',
  },
  {
    name: '雷欧纳德·索恩',
    role: '铁壁骑士 / 大地战将',
    desc: '热血直率的王国战士，拥有强大的冲锋与守阵能力，是后续远征中的重装支柱。',
  },
  {
    name: '莉奥拉·月影',
    role: '月影游侠 / 森灵追猎者',
    desc: '来自月影精灵森林的少女，擅长追踪、突袭与自然协同，是远征途中关键的侦查者。',
  },
];

const pillars = [
  '兄妹双线成长与长篇章远征',
  '人与魔兽的共鸣战斗系统',
  '元素地形、羁绊与连携奥义',
  '可持续扩展的网页 SRPG 关卡结构',
];

const milestones = [
  '首页 + 世界观页已上线',
  '第一关“星隐乡守卫战”已可试玩',
  '敌我回合、联动技、增援事件已接入',
  'Vercel 部署已完成，可直接试玩',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e2a78,_#0b1024_55%,_#050816)] text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div className="max-w-4xl space-y-6">
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
              Web SRPG Project • 高画质策略战棋
            </span>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight lg:text-7xl">
                埃瑟兰战记：<span className="text-cyan-300">星尘之绊</span>
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-200 lg:text-xl">
                在星隐乡的屏障崩裂之后，塞缪尔与妹妹伊索尔德被迫站上前线，带着魔兽伙伴和未来的远征同伴，
                踏上横跨四国、追查暗影裂隙复苏真相的长征之路。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="/prototype"
                className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                立即试玩第一关
              </a>
              <a
                href="#milestones"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 transition hover:border-cyan-200 hover:text-cyan-200"
              >
                当前开发进度
              </a>
              <a
                href="/lore"
                className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                世界观设定
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Playable Demo</p>
            <h2 className="mt-3 text-3xl font-bold">第一关可试玩状态</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              当前线上版本已包含第一关“星隐乡守卫战”，支持敌我回合、兄妹联动、灵鹿治疗协作、敌方增援与关卡结果反馈。
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Live Demo Route</p>
                <p className="mt-2 text-lg font-semibold text-white">/prototype</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Core Loop</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">布阵、行动、治疗、连携、守点、击退增援。</p>
              </div>
            </div>
          </aside>
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

      <section id="milestones" className="mx-auto max-w-7xl px-6 py-4 lg:px-10 lg:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Build Milestones</p>
          <h2 className="mt-3 text-3xl font-bold lg:text-4xl">当前试玩版已完成的内容</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {milestones.map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="text-sm text-cyan-300">Milestone {index + 1}</div>
                <p className="mt-2 text-lg font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
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
