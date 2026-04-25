type GeneratorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const roles = ['人类战士', '元素法师', '精灵弓箭手', '重甲圣殿骑士', '魔族狂战士', '暗影魔物'];
const actions = ['待机', '行走', '冲刺', '普攻', '重击', '施法', '受击', '僵直', '死亡'];
const providers = ['Doubao', 'OpenAI Images', 'Gemini'];

const outputs = [
  '透明背景角色序列帧',
  '自动裁边并统一尺寸',
  'PixiJS 图集 PNG + JSON',
  '可下载 ZIP 素材包',
];

export default async function GeneratorPage({ searchParams }: GeneratorPageProps) {
  const params = (await searchParams) ?? {};
  const queued = params.queued === '1';
  const jobId = typeof params.jobId === 'string' ? params.jobId : null;
  const queueDepth = typeof params.queueDepth === 'string' ? params.queueDepth : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#25314f,_#0d1326_58%,_#05070d)] text-white">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
              公共在线工具 · One-click Asset Generator
            </span>
            <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">一键制图与图集生成前端</h1>
            <p className="max-w-3xl text-base leading-8 text-slate-200 lg:text-lg">
              面向所有用户的公共素材工具。上传任意参考图，选择角色类型与动作后，一键走透明化、裁边、图集打包和下载流程。
            </p>
          </div>
          <a
            href="/pipeline"
            className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            切换到内部追踪台
          </a>
        </div>

        <div id="battle-upload" className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-50">
          <div className="text-sm uppercase tracking-[0.3em] text-amber-200">Battle asset upload</div>
          <p className="mt-3 text-lg font-semibold">这里就是你要上传战斗动画素材的前端入口</p>
          <p className="mt-2 text-sm leading-7 text-amber-50/90">
            适合先上传角色参考图、动作参考、技能演出参考或现有序列帧。提交后会直接写入 queue，并把文件保存到对应 job 的 uploads 目录。
          </p>
        </div>

        {queued && (
          <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50">
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-200">Queued successfully</div>
            <p className="mt-3 text-lg font-semibold">任务已写入队列{jobId ? `，Job ID: ${jobId}` : ''}</p>
            <p className="mt-2 text-sm leading-7 text-emerald-100/90">
              当前队列深度：{queueDepth ?? '-'}。上传文件也会保存到该 job 对应目录，后续处理脚本可以直接消费。
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Generator Form</p>
            <h2 className="mt-2 text-2xl font-bold">配置这次生成任务</h2>

            <form action="/api/generator" method="post" encType="multipart/form-data" className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  角色类型
                  <select name="role" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none">
                    {roles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-200">
                  动作
                  <select name="action" defaultValue="受击" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none">
                    {actions.map((action) => (
                      <option key={action}>{action}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-200">
                  帧数
                  <input
                    name="frameCount"
                    defaultValue={8}
                    type="number"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-200">
                  AI Provider
                  <select name="provider" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none">
                    {providers.map((provider) => (
                      <option key={provider}>{provider}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-200">
                参考图 / 动画素材上传（现在会保存到 job 目录）
                <input name="referenceFiles" type="file" multiple className="rounded-2xl border border-dashed border-cyan-300/25 bg-slate-950/60 px-4 py-6" />
              </label>

              <input type="hidden" name="intent" value="battle-animation-assets" />

              <label className="grid gap-2 text-sm text-slate-200">
                追加说明
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="比如：Samuel 普攻/受击参考，保留当前角色比例；需要透明背景；优先适配战斗全屏演出与棋盘内 sprite。"
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
                  上传战斗动画素材（写入队列）
                </button>
                <a href="/pipeline" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/90 transition hover:border-cyan-200 hover:text-cyan-200">
                  去内部追踪台看结果
                </a>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">What the pipeline returns</p>
            <h2 className="mt-2 text-2xl font-bold">自动交付内容</h2>
            <div className="mt-6 grid gap-4">
              {outputs.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-100">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-400/8 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200">当前流程说明</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-100">
                <p>1. 用户上传参考图或动画素材，表单请求进入 `/api/generator`。</p>
                <p>2. 线上前端当前已先打通“提交成功与任务登记预览”这一层，避免继续 500。</p>
                <p>3. 真正的“自动去背景 → 拆帧/补帧 → 打包图集 → 输出可运行动画”后台 worker 还没接到线上持久存储，所以这一步还在补。</p>
                <p>4. 也就是说，现在前端入口可继续完善，但完整自动生产链路还需要再接一段后端持久化和处理 worker。</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
