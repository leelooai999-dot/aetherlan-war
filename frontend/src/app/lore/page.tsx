const kingdoms = [
  {
    name: '星隐乡',
    desc: '被魔法屏障守护的北方秘境，宁静、封闭，却最先感受到暗影裂隙复苏的震动。',
  },
  {
    name: '铁脊王国',
    desc: '崇尚骑士与钢铁的南方强国，在权力阴谋与魔兽灾潮之间摇摇欲坠。',
  },
  {
    name: '月影精灵森林',
    desc: '精灵一族的栖居地，保管着古老魔法典籍，也埋藏着共生契约的秘密。',
  },
  {
    name: '霜雪王国',
    desc: '极北冰原上的孤高国度，掌握净化暗影的重要冰系秘术。',
  },
  {
    name: '澜汐王国',
    desc: '东部海潮与魔法并存的学术王国，保存着解读封印石碑的关键知识。',
  },
];

export default function LorePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">World Lore</p>
          <h1 className="text-4xl font-bold lg:text-6xl">埃瑟兰大陆设定</h1>
          <p className="text-lg leading-8 text-slate-300">
            百年前的元素浩劫之后，大陆迎来了短暂和平。如今，黑雾重新蔓延，古老封印松动，人与魔兽的共生契约正遭到撕裂。
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {kingdoms.map((kingdom) => (
            <section key={kingdom.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-cyan-200">{kingdom.name}</h2>
              <p className="mt-4 leading-7 text-slate-300">{kingdom.desc}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
