# Progress Log

## 2026-04-18 19:46 PDT
- 已创建项目目录 `projects/aetherlan-war`
- 已保存初版提案 `docs/proposal.md`
- 已建立 README 与进度日志
- 下一步：补齐 GDD / PRD，并搭建前端项目骨架

## 2026-04-18 19:47 PDT
- Next.js + Tailwind 前端脚手架创建完成
- 已替换首页为《埃瑟兰战记：星尘之绊》项目展示页
- 已写入主角团展示与项目定位模块
- 下一步：补剧情世界观版块，并开始战棋原型页面

## 2026-04-18 19:48 PDT
- 已新增 `/lore` 世界观页面
- 已新增 `/prototype` 战棋原型页面
- 首页已接入世界观与原型入口
- 下一步：接入基础交互逻辑，并整理首章关卡设计文档

## 2026-04-18 19:51 PDT
- 已完成第一章 1-10 关的初版关卡文档
- 战棋原型已升级为可选中单位、相邻移动的交互版本
- 本地开发服务已重新启动中
- 下一步：加入攻击逻辑、回合切换和战斗UI

## 2026-04-18 20:22 PDT
- 已确认本地开发服务正常运行
- 生产构建已通过，可部署状态正常
- 已加强战棋页手机触屏适配、小屏滚动与回合切换UI
- 下一步：接入攻击交互，并准备 Vercel 预览部署

## 2026-04-18 20:26 PDT
- 已完成移动 / 攻击模式切换
- 已加入近战攻击、生命值显示、战斗日志
- 再次确认生产构建通过
- 下一步：初始化独立仓库或清理发布目录后部署到 Vercel 预览

## 2026-04-18 20:55 PDT
- 已开始创建独立发布目录 `releases/aetherlan-war`
- 首次 rsync 同步异常，已切换为直接复制方式修复
- 正在验证独立发布包构建
- 下一步：通过构建后接入 Vercel 预览

## 2026-04-18 21:02 PDT
- 用户已授权接下来 8 小时内持续推进，不需等待确认
- 已建立夜间执行说明 `OVERNIGHT.md`
- 继续目标：发布包可构建、原型增强、内容扩写、预览部署准备

## 2026-04-19 08:14 PDT
- 已新增 `docs/story-outline.md`，把故事大纲中的角色锚点单独固化
- 明确记录：伊索尔德是塞缪尔的妹妹，17 岁，风系与治愈系角色，搭档魔兽为月溪灵鹿
- 后续根据图片生成角色时，将优先回看该文件，避免人物关系与技能方向跑偏

## 2026-04-19 08:19 PDT
- 已重做 `/prototype` 原型页，使其更贴近当前故事大纲
- 将伊索尔德正式对齐为妹妹定位，并加入风愈术技能
- 新增月溪灵鹿单位与群体治疗能力，开始体现“移动治愈站”设定
- 新增技能模式、地形类型（森林/溪流/遗迹）与更明确的首战目标文案
- 已重新验证前端生产构建通过

## 2026-04-19 09:02 PDT
- 已为原型加入敌方自动推进与攻击逻辑，战斗开始具备基础敌方回合
- 已加入胜利 / 失败条件、防线结界耐久与回合计数
- 已加入兄妹联动与伊索尔德-月溪灵鹿治疗共鸣的战斗加成
- 已补充关卡状态面板、失败条件说明与战斗重置入口
- 再次确认前端生产构建通过

## 2026-04-19 09:11 PDT
- 已为原型加入事件提示横幅、友军角色卡面板与更清晰的关卡状态反馈
- 已加入兄妹合击技“星风连携”，使塞缪尔在兄妹相邻时获得更强技能表现
- 已加入第 6 回合暗影增援“裂隙收割者”，让关卡有阶段变化与中盘压力
- 已提升敌方寻路逻辑，优先压迫关键角色与据点
- 修复实现过程中的字符串语法错误，并再次确认前端生产构建通过

## 2026-04-19 09:16 PDT
- 已加入阶段对白面板，让第一关开始具备剧情推进与战斗内对话反馈
- 已为友军加入每回合仅行动一次的限制，提升 SRPG 节奏与战术权衡感
- 已补充“全员行动完毕”的状态提示，使任务流程更清晰
- 已将关键技能与胜败节点接入对白反馈，增强事件驱动感
- 修复新增对白时产生的语法错误，并再次确认前端生产构建通过

## 2026-04-19 09:55 PDT
- 已加入第一关任务流面板，显示目标、完成度、击退敌军数与据点耐久
- 已加强关卡引导文案，使试玩时更容易理解当前目标与节奏
- 已补充结束回合的提示说明，降低新试玩用户的困惑成本
- 再次确认前端生产构建通过，第一关 Demo 正持续向可部署试玩版收口

## 2026-04-19 12:31 PDT
- 已补上第一关结果面板，使通关/失败后有更明确的结尾反馈与重开入口
- 已在任务流区域加入当前状态标记，试玩者更容易理解自己是否已通关
- 已再次验证前端生产构建通过，当前 Demo 已非常接近可部署试玩状态

## 2026-04-19 15:00 PDT
- 已升级首页，使其更像正式试玩入口，直接强调第一关已可试玩与当前完成内容
- 已将首页文案进一步对齐兄妹主线与月溪灵鹿设定，减少设定偏差
- 已补充开发里程碑展示，方便试玩者快速理解当前版本范围
- 已再次确认前端生产构建通过，可继续随时部署新版本

## 2026-04-23 19:58 PDT
- 已将 `/prototype` 的普通攻击/技能演出接入真正的全屏战斗层，不再只是页面内小窗表现
- 已接入 PixiJS 并实现首版全屏横版战斗舞台，包含左右对战站位、冲刺、斩击光效、命中闪白、镜头震动、伤害数字与退场收束
- 已让地图战斗逻辑在全屏演出期间暂停敌方自动回合，避免演出与回合推进互相打架
- 已确认前端生产构建再次通过，接下来可以继续叠更细的技能特效、分层粒子与更复杂 timeline

## 2026-04-23 10:49 PDT
- 已收到最新优先级调整，当前最高优先级改为 Hyper Dash ticker-visibility 功能
- 新目标 1：在单一入口展示全部支持的 ticker
- 新目标 2：提供快速 searchable / filterable 的检索体验
- 新目标 3：从 ticker 列表可一键跳转进入 simulation / chart view
- 下一步：先整理为可执行 build spec，再按最快可上线顺序推进实现

## 2026-04-25 06:13 PDT
- 已继续推进 Aetherlan War 的战斗演出层，不停留在基础冲刺命中，而是开始做角色差异化技能演出
- 全屏战斗层已新增 support-caster 机制，可在连携技能时把辅助施法者一起带入演出画面
- 已为「星风连携」接入风系能量丝带、辅助施法者入镜、协同爆发文本与双环冲击反馈，让兄妹组合技更像真正必杀技
- 已为普通技能演出补上 aura 分类（wind / slash），为后续角色定制特效继续留出扩展位
- 下一步：验证前端构建通过，并继续补伊索尔德 / 月溪灵鹿各自独立的全屏技能表现

## 2026-04-25 06:18 PDT
- 已把伊索尔德的「风愈术」接入全屏技能演出，不再只是地图层直接回血
- 已把月溪灵鹿的「月溪祝祷」接入独立全屏演出，并补上 lunar aura 分支，为治疗系演出和攻击系演出做出明确区分
- 全屏结算数字已支持 heal 文案与不同 aura 配色，治疗技不再错误显示为纯伤害反馈
- 下一步：继续做地图层到全屏层的过渡感，比如技能起手聚焦、回场落点与更强的命中/治愈收束节奏

## 2026-04-25 06:23 PDT
- 已补上战斗起手的 screen flash 过渡层，让地图层切进全屏层时不再那么生硬
- 起手闪层已按 attack / skill / lunar aura 区分颜色，普通攻击、风系技能、月华治愈的入场情绪开始分离
- 全屏战斗底层也补了额外中心聚焦光晕，画面切入时更像正式演出而不是直接弹窗
- 底部结算牌已同步支持 heal 文案，避免治疗演出里仍出现错误伤害语义
- 下一步：继续做回场衔接和地图单位落点感，让演出结束后重新回到棋盘时更顺

## 2026-04-25 06:28 PDT
- 已补上回场 return FX，演出结束后攻击者会在棋盘层触发短促回落反馈，不再是全屏一关就瞬间恢复静止
- 回场反馈已作为独立 combat fx 类型接入，后面还能继续扩成“落地尘波”“站稳收势”等更完整的回场动作
- 治疗类全屏演出结束时也会把 heal 反馈重新打回目标单位，地图层和演出层的因果关系更清晰
- 下一步：继续补“起手锁定谁、回场落到谁”的镜头感，以及更强的目标聚焦提示

## 2026-04-25 06:31 PDT
- 已补上 targetFocus 状态，起手时会把本次攻击/技能目标重新映射回棋盘格
- 棋盘目标格现在会按攻击 / 技能 / 月华治疗显示不同颜色的高亮与 target 标签，玩家更容易理解“这一招究竟指向谁”
- 这让地图层与全屏层之间第一次真正共享了“目标语义”，不再只是演出完再盲目回棋盘
- 下一步：继续补起手前的短促锁定预备感，尽量做出更像 SRPG 必杀镜头的前摇

## 2026-04-25 06:34 PDT
- 已把 targetFocus 扩成 lock → commit 两段状态，起手前不再直接进入命中语义，而是先出现短促锁定前摇
- 棋盘目标格现在会先显示 LOCKING，再进入真正的 ATTACK TARGET / SKILL TARGET / HEAL TARGET，前 100 多毫秒的戏感开始出来了
- 这一步虽然很小，但已经把“点击后立刻播片”的机械感削弱了一层，更接近 SRPG 技能镜头的蓄势感
- 下一步：继续补施法者/攻击者本人的起手预备反馈，让锁定不只发生在目标端，也发生在出手端

## 2026-04-25 06:38 PDT
- 已补上 attackerFocus，出手单位现在也有 charge → release 两段前摇反馈，不再只有目标格被高亮
- 棋盘上的出手者会先显示 CHARGING，再进入 RELEASING，攻击端和目标端终于形成一前一后的镜头关系
- 攻击者高亮也按 attack / skill / lunar aura 区分色调，普通攻击、技能释放、月华治愈的蓄势感开始有差异
- 下一步：继续补更像“线性镜头语言”的连线/方向性提示，让攻击者与目标之间的关系更直观

## 2026-04-25 06:42 PDT
- 已补上 attacker → target 的方向连线和目标落点圆环，出手关系不再只靠两个独立高亮去猜
- 连线粗细、亮度和颜色会跟随 charge / release 以及 aura 变化，前摇和出手瞬间的方向感更强
- 这已经开始接近 SRPG 技能镜头里“攻击线先拉起来，再切全屏”的语言了
- 下一步：验证这一版构建是否通过，并继续修正连线在响应式棋盘里的稳定性

## 2026-04-25 06:46 PDT
- 已修正方向连线的核心实现，去掉不稳定的 CSS sqrt 表达式，改为组件内直接计算 distance / angle
- 现在连线长度和旋转角度都由真实数值驱动，后续做响应式稳定性和镜头扫光会更可控
- 下一步：继续验证这版构建，并看是否需要把连线再做成更像“镜头拉线”的渐进扫光

## 2026-04-25 06:50 PDT
- 已为 attacker → target 连线补上 sweep 扫光，release 瞬间会沿线掠过一条高亮，镜头语言比静态亮条更像“出手导线”
- 这让前摇逻辑从单点高亮正式升级成“攻击者蓄势 → 锁定目标 → 方向线扫过 → 全屏演出”四段连续动作
- 下一步：继续验证构建，并准备做一轮整体 polish，减少局部动画各说各话的问题

## 2026-04-25 06:55 PDT
- 已把前摇、切相、命中、收束相关的关键时间常量集中进 cinematicTiming，开始从“能跑”收口到“节奏一致”
- 现在 targetFocus / attackerFocus / battleCinematic 不再各自散落硬编码时长，后续微调整套战斗镜头节奏会快很多
- 下一步：验证构建，然后继续做一轮节奏微调，看看是否要把普通攻击和技能的节奏差再拉开一点

## 2026-04-25 07:02 PDT
- 按用户当前需求，已把 pipeline / generator 两个前端入口重新整理成“先看 pipeline，马上跳上传”的结构
- `/pipeline` 顶部现在直接给出“立即上传素材”入口，不需要再猜该去哪一页上传战斗动画素材
- `/generator` 已明确标成 battle asset upload 入口，表单文案、按钮文案、默认动作与 notes 提示都改成面向战斗动画素材上传
- 下一步：验证构建通过后，把可访问链接直接给用户，让其开始上传素材

## 2026-04-25 07:09 PDT
- 用户实测发现 `/generator` 提交时报 HTTP 500，已定位高概率根因是部署环境（Vercel）下 API route 直接写 workspace 目录导致失败
- 已把 generator API route 改成运行时自动选路径：本地继续写 workspace pipeline，Vercel 则降级写到系统 tmp 目录，避免因文件系统限制直接 500
- 同时补了 job key fallback 逻辑，就算 index 文件不可用也不会整条请求崩掉
- 下一步：重新验证构建并让用户重试提交；若仍报错，再抓运行时日志继续修

## 2026-04-25 07:12 PDT
- 用户随后贴出 `/api/generator#battle-upload` 的 HTTP 405，这次是访问路径用错了，不是表单提交流程本身
- 已给 `/api/generator` 补 GET 处理，今后即使直接点到 API 地址，也会返回明确提示：浏览器请用 `/generator#battle-upload`
- 下一步：构建通过后，直接把正确上传地址发给用户，避免再走到 API 路由页

## 2026-04-25 07:48 PDT
- A 线继续推进：本地 `next dev` 下 `/api/generator` 已验证 200，说明当前 route handler 代码本身可工作；线上 Vercel 仍回 500，更像部署版本未更新或平台侧配置差异
- 已把修复提交并推到 GitHub `main`，后续继续追线上部署链路
- B 线继续推进：`tools/animation-pipeline/scripts/process-queue.mjs` 不再只是纯 stub，现在会对上传的 `.png/.webp` 资源尝试调用 `python/preprocess_frames.py` 做 trim 预处理，并把结果写入 output manifest
- `animation-pipeline/.venv` 内 Pillow 已可用，因此这条“上传图片 → 基础预处理”链路在本地 pipeline 侧已经具备继续扩展的基础
- 下一步：继续追 Vercel 为什么没吃到新 route，同时把 preprocess 结果进一步接到 atlas/manifest 流程

## 2026-04-25 07:53 PDT
- 已确认根因：修复代码已成功部署到 `aetherlan-war-frontend` 项目，而用户一直测试的是另一个旧项目域名 `aetherlan-war.vercel.app`
- 实测结果：`https://aetherlan-war-frontend.vercel.app/api/generator` 已返回 200；旧地址 `https://aetherlan-war.vercel.app/api/generator` 仍为 500
- 这意味着 A 线的“上传不再炸”在新前端项目上已经成立，下一步需要统一用户入口/域名，避免继续访问旧站
- B 线继续：接下来把 preprocess 产物继续接入 manifest/atlas，让上传 PNG 后不止登记，还能形成后续可消费的处理结果

## 2026-04-25 07:26 PDT
- 已把旧项目 `aetherlan-war` 重新 link 并从仓库根目录成功部署，`aetherlan-war.vercel.app` 现已切到最新前端代码
- 实测确认：旧主域名上的 `/api/generator` 与 `/generator#battle-upload` 现在都返回 200，不再是 HTTP 500
- 为避免用户上传成功后在 `/pipeline` 看到 0 条任务产生误解，已补充说明：当前线上是 preview 接收模式，本地 pipeline 看板尚未自动同步线上 queue 结果
- 下一步：继续把线上上传结果与本地 queue/dashboard 串起来，让 pipeline 页真正显示上传后的可见结果

## 2026-04-25 08:33 PDT
- 已继续补 generator 成功回显：上传成功后不再只显示 job id，而会直接显示本次角色类型、动作、provider、接收文件数与文件名
- 这让线上 preview 模式下的“确实收到什么素材”变得前端可见，不需要用户再猜到底有没有传上去
- 下一步：继续做 pipeline 页的结果回流与 worker 接续，让上传后的素材状态在生成追踪页里也能看见

## 2026-04-25 08:40 PDT
- 已继续把线上接收结果往 `/pipeline` 回流：从 generator 成功页跳转到 pipeline 时，会把最近一次线上接收的 job id、角色、动作、provider、文件数和文件名一起带过去

## 2026-04-25 13:06 PDT
- 已确认现有 Hetzner 主机 `178.156.247.8` 正在运行，规格相当于 CPX21 档：约 3.7 GiB RAM、75G 磁盘、44G 可用
- 已确认这台机上当前只存在两个独立项目目录：`/opt/montecarloo` 与 `/opt/pyeces`，因此 Aetherlan War 继续复用同机是可行的，但必须严格目录 / env / systemd 隔离
- 已新增 `docs/hetzner-backend-plan.md`，明确 Aetherlan War 的独立目录约定为 `/opt/aetherlan-war/{backend,worker,uploads,queue,results,logs}`，并规划独立服务名 `aetherlan-war-backend.service` / `aetherlan-war-worker.service`
- 这一步的意义是把“可以复用现有 Hetzner”从口头判断推进成可执行的落地结构，为下一步真正把上传持久化到 Hetzner 后端做准备

## 2026-04-25 13:24 PDT
- 已继续把前端往独立后端切换做准备：`frontend/src/app/generator/page.tsx` 不再把表单 action 写死为 `/api/generator`，而是支持从 `NEXT_PUBLIC_GENERATOR_ACTION_URL` 读取可配置 intake endpoint
- 已同步更新 `frontend/next.config.ts` 和 `frontend/src/app/api/generator/README.md`，明确后续可以把公共上传表单直接切到独立 Hetzner backend，而不用再重改 generator 页本身
- 这一步把“未来切外部持久化后端”从想法推进成可切换配置位，为下一步真正让浏览器直投 Hetzner intake endpoint 做铺路

## 2026-04-25 15:04 PDT
- 已在 Hetzner 主机上真实创建 Aetherlan War 独立目录：`/opt/aetherlan-war/{backend,worker,uploads,queue,results,logs}`，没有和 `/opt/montecarloo`、`/opt/pyeces` 混目录
- 已新增最小持久化 intake backend skeleton：`projects/aetherlan-war/backend/intake_server.py`，可接收 `POST /api/generator`、把上传文件写入 `/opt/aetherlan-war/uploads/<jobId>/`，并把 job JSON 写入 `/opt/aetherlan-war/queue/<jobId>.json`
- 已把该 skeleton rsync 到 Hetzner 并成功本机 health check：`http://127.0.0.1:8010/health` 返回 `{"ok": true, "service": "aetherlan-war-intake", "storage": "/opt/aetherlan-war"}`
- 这意味着 Aetherlan War 现在第一次拥有了真正的持久化上传入口雏形，不再只有 Vercel preview intake；下一步就是把前端表单切到这个 persistent endpoint 并补 browser-compatible 返回流

## 2026-04-25 15:08 PDT
- 已修正最小 intake backend 的 multipart 解析细节（补 `CONTENT_LENGTH` 并收紧 `referenceFiles` 处理），现在 Hetzner 上的真实 `POST /api/generator` smoke test 已返回 200
- smoke test 已实际返回 persistent queue 响应，示例 job id：`gen-20260425220734-152f61`，并带回 `storage: hetzner-disk-persistent` 与 `workerPayload.status: persistent-intake-received`
- 这说明“上传文件落盘 + queue job JSON 生成 + 标准化 worker payload 返回”这条 Hetzner persistent intake 主路径已经打通，接下来就可以继续把浏览器表单切过去

## 2026-04-25 15:18 PDT
- 已继续把 Hetzner intake 从临时 nohup 进程推进成正式 systemd 服务：新增 `backend/aetherlan-war-intake.service`，并在服务器上安装为 `aetherlan-war-intake.service`
- 已同步补 `backend/nginx.aetherlan-war-intake.conf.example`，为后续独立反向代理入口预留单独 server block，不和 montecarloo / pyeces 混 nginx 配置
- 这一步把 Aetherlan War 的持久化 intake 从“能跑的临时脚本”继续推进为“可长期维护的独立服务”，离前端正式切过来又近了一步

## 2026-04-25 15:30 PDT
- 已把 Aetherlan War intake 的独立 nginx 站点配置安装到 Hetzner：`/etc/nginx/sites-available/aetherlan-war-intake`，并启用到 `sites-enabled`
- 已用 host header 本机验证反代入口命中成功：`curl -H "Host: aetherlan-intake.montecarloo.com" http://127.0.0.1/health` 返回 200
- 这说明持久化 intake 已不只是在 8010 裸端口可用，而是已经具备了单独站点入口雏形，下一步就是补公网 DNS / SSL 或直接切前端到这个入口

## 2026-04-25 15:59 PDT
- 已新增 `tools/animation-pipeline/scripts/pull-hetzner-queue.sh`，可以把 Hetzner 持久化 intake 的 queue JSON 从 `/opt/aetherlan-war/queue/` 同步回本地 worker workspace 的 `tools/animation-pipeline/queue/`
- 已实际拉回两个真实 Hetzner job：`gen-20260425220734-152f61` 与 `gen-20260425223011-b36979`
- 已运行本地 worker 链路：`node ./scripts/process-queue.mjs && node ./scripts/build-queue-dashboard.mjs && node ./scripts/build-manifest.mjs`，结果 `queue-processed: 2`
- 这意味着上传链路现在首次真正跨过了“只接收不处理”的阶段，已经形成了：Hetzner persistent intake -> 本地 queue sync -> local consumer 处理 -> dashboard / manifest 更新 的闭环雏形

## 2026-04-25 17:04 PDT
- 已新增 `tools/animation-pipeline/scripts/push-hetzner-results.sh`，可以把本地 `output/queue-results/` 再同步回 Hetzner `/opt/aetherlan-war/results/`
- 已实际把两个本地处理结果推回 Hetzner：`gen-20260425220734-152f61.result.json` 与 `gen-20260425223011-b36979.result.json`
- 这让当前链路从“远端 queue 拉回本地处理”继续推进成“远端 intake -> 本地消费 -> 结果再写回远端 results”的双向闭环，为后续 `/pipeline` 直接读取 persistent results 做好了基础

## 2026-04-25 17:12 PDT
- 已继续升级 `/pipeline` 页面表达，不再只强调 preview intake，而是开始明确展示 persistent queue 已跑通的状态
- 现在只要 `queue-dashboard.json` 里检测到 `storage: hetzner-disk-persistent` 的 job，页面就会显示“persistent intake 已进入闭环雏形”的绿色提示
- 队列卡片也开始显示 `storage`，结果卡片开始显示 `workspace root` 与可回溯的 upload refs，使 persistent 链路比之前更可见、更像真正的生产追踪台

## 2026-04-25 17:14 PDT
- 已补 `docs/persistent-intake-cutover.md`，把从 Vercel preview intake 切到 Hetzner persistent intake 的真实切换顺序写清楚
- 已把 `frontend/.env.example` 更新为明确的目标值：后续浏览器上传切换目标不再是抽象占位符，而是 `https://aetherlan-intake.montecarloo.com/api/generator`
- 这一步把“下一步怎么正式切公网 persistent endpoint”从口头计划推进成可执行 runbook，等 DNS / SSL 一补齐就能直接落切换

## 2026-04-25 17:49 PDT
- 已继续收口结果语义：本地 `queue-results/*.result.json` 和 `animation-manifest.json` 现在开始补带 `source` 信息，用来标记 intake storage 与 queue job 来源
- 同时把远端 persistent upload 路径重新补回到 result 的 `uploads` 字段里，避免结果卡片只剩 workspace 路径却丢失远端上传来源
- 这一步让 persistent queue/result 不只是“处理完成”，而且开始具备更像生产流水线的可追溯性，方便后续 `/pipeline`、worker 和外部后端继续对齐同一套来源语义

## 2026-04-25 17:55 PDT
- 已继续升级 `/pipeline` 结果卡片的数据结构，正式支持显示 `source.intakeStorage`、`source.queueJobPath`、`remote upload paths`
- 同时把现有两个真实 job 的 `queue-results` 与 `animation-manifest.json` 都重新 patch 一遍，确保页面现在就能看到 persistent 链路的来源追踪信息，而不需要等下一批任务才生效
- 这一步让 `/pipeline` 不只是知道“这条任务 done 了”，而是开始知道“它从哪台持久化 intake 来、对应哪条 queue、原始远端上传路径是什么”

## 2026-04-25 18:19 PDT
- 已确认 Cloudflare token 可用，并实际为 `aetherlan-intake.montecarloo.com` 创建了 A 记录，指向 Hetzner `178.156.247.8`（proxy 已开启）
- 当前公共 DNS 还在传播中，所以外部解析还没立即生效，但公网入口这一步已经不再是纸面计划，而是实打实开始落地
- 同时已准备好 `aetherlan-intake` 的 HTTP-only nginx 配置与未来 443 版本配置，等解析生效后即可继续签证书并切 HTTPS

## 2026-04-25 18:30 PDT
- 已确认 `aetherlan-intake.montecarloo.com` 公网 DNS 已生效，并成功签下 Let's Encrypt 证书，证书路径为 `/etc/letsencrypt/live/aetherlan-intake.montecarloo.com/`
- 已确认通过 HTTPS + Host 访问 intake 入口可命中后端（当前 `/health` 返回 body `{"status":"ok"}`，说明公网域名已经真正通到服务侧）
- 已把 Vercel production 环境变量 `NEXT_PUBLIC_GENERATOR_ACTION_URL` 正式设置为 `https://aetherlan-intake.montecarloo.com/api/generator`
- 已将前端 production 重新部署到 Vercel，主域 `https://aetherlan-war.vercel.app` 现已切到使用 Hetzner persistent intake endpoint 的版本

## 2026-04-25 18:43 PDT
- 已定位 `413 Request Entity Too Large` 的直接原因：不是 1.45MB 图片格式不合规，而是公网实际生效的 intake nginx 站点仍然只有 `listen 80` 版本，HTTPS 请求没有命中预期的 50M/100M body limit 配置
- 现已把 Hetzner 上 `aetherlan-war-intake` nginx 站点升级为同时提供 `80` + `443 ssl http2`，并把 `client_max_body_size` 提高到 `100M`
- 下一步是立刻重测公网上传，确认 1.45MB 这类正常 battle reference 图不再被入口层错误拦截

## 2026-04-25 20:18 PDT
- 已继续把“上传成功后如何确认处理完成”往前推：开始从 Hetzner persistent queue 拉取最新 job，在本地 consumer 侧实际处理新上传任务，并把结果重新回写到 Hetzner `/opt/aetherlan-war/results/`
- 目标不是停留在 intake 成功，而是让新上传 battle reference 图尽快在 `/pipeline` 上体现为真正的 recent result，至少能看到 job 进入处理闭环、产出 manifest / atlas / bundle 级结果
- 这一步是把“现在只能确认上传成功”继续推进到“能确认进入后处理并可在看板看到结果”

## 2026-04-25 21:23 PDT
- 已继续补 `/pipeline` 的可视确认层：开始为 recent result 生成 `previewUrl`，把每个 job 的输入参考图复制到 `frontend/public/generated-previews/` 供页面直接预览
- 这不是最终成品预览，但至少先解决“上传后我连参考图和对应 job 都没法肉眼对照”的问题，让用户可以在结果卡片上直接看到该 job 对应的输入图
- 同时在结果卡片增加 `previewStatus`，配合 `processingStage` 一起告诉用户：现在看到的是输入参考图预览，还是已经进入更靠后的真实资产产出阶段

## 2026-04-25 21:40 PDT
- 已将“输入参考图预览”这层接到前端公开目录，最近真实上传的 job 现在可以通过 `previewUrl` 显示在 `/pipeline` 的 recent result 卡片里
- 正在把这版重新部署到 Vercel production，这样用户可直接在 `https://aetherlan-war.vercel.app/pipeline` 的最近结果卡片里看到对应上传图的预览
- 当前能在 Vercel 上看到的是输入参考图预览，不是最终成品图；后续还会继续把 preprocess/atlas/zip 产物预览也接上

## 2026-04-25 21:42 PDT
- 已确认真实 preprocess 产物存在，例如 `gen-20260426022445-6c7d7d` 已产出 `outputs/processed/samuel profile pic男主头像.trimmed.png`
- 已开始把这类 preprocess 后图片同步到 `frontend/public/generated-previews/`，并为 queue result 增加 `processedPreviewUrl`
- 目标是让 `/pipeline` 的 recent result 卡片从“只能看输入参考图”升级为“可并排看 input reference 与 processed preview”，这样用户可以直接在 Vercel 上确认当前去背景/裁边阶段到底产出了什么

## 2026-04-25 21:44 PDT
- 已开始把 input / processed 双预览版重新部署到 Vercel production，目标是让用户在 `https://aetherlan-war.vercel.app/pipeline` 的 recent result 卡片里直接看到图片而不是只看字段
- 这次线上更新的重点是“能看到预览图片”本身，不是再加更多状态文案；等这版上线后，页面就能开始承担最基本的肉眼验收功能

## 2026-04-25 21:45 PDT
- 已继续修正 preview 数据回写，确保 `queue-results/*.result.json` 真实带上 `previewUrl` 和 `processedPreviewUrl`，而不是只有静态图片文件已部署但页面读取的结果 JSON 还是旧字段
- 当前重新构建的重点是让 `/pipeline` 页面和 `generated-previews/` 目录保持同一批数据版本，避免“图片已经上线但结果卡片还显示 no-preview-file-yet”

## 2026-04-25 21:49 PDT
- 已确认最后一层问题在于 `queue-dashboard.json` 仍是旧版本；重建后 `recentResults` 现在已经真实带上 `previewUrl` / `processedPreviewUrl`
- 正在基于这份新 dashboard + manifest 再次部署 Vercel production，目标是让 `/pipeline` 页面最终实际渲染出双预览图片，而不是只有静态资源本身在线

## 2026-04-25 22:10 PDT
- 对 `/pipeline` 前端显示内容做了安全收敛检查，确认页面原先直接暴露了 workspace 绝对路径、queue 文件路径、manifest/atlas/frame/bundle 文件路径，以及远端 upload 路径，这些都不该在公开前端直接显示
- 已将这些敏感路径类字段改成抽象化进度项与勾选状态，例如 `queue intake recorded`、`output manifest recorded`、`workspace job created`、`storage handoff` 等，保留用户需要的可见进度，不再暴露内部文件系统结构

## 2026-04-25 22:18 PDT
- 继续对 `/pipeline` 做源头收紧：不只页面卡片脱敏，还移除了“最近一次线上接收”区域里的 `Worker-ready JSON`、provider 回显、uploadNames 直出等实现细节，改成纯进度摘要卡片
- 同时对 `tools/animation-pipeline/output/queue-results/*.json`、`queue-dashboard.json`、`animation-manifest.json` 做脱敏重写，去掉 `sourcePath`、`remotePersistentPath`、`jobInputPath`、`queueJobPath` 以及 workspace 路径字段，避免后续页面或别的 consumer 再把这些内部路径泄露出来

## 2026-04-25 22:30 PDT
- 继续收紧 generator → pipeline 的 query 参数回流链路，去掉成功跳转 URL 中的 `uploadNames` 与 `provider`，避免文件名和 provider 通过浏览器地址栏、分享链接、history 或 referrer 再次暴露
- 同步更新了 Vercel preview `/api/generator` 与 Hetzner `intake_server.py` 两端的 redirect 逻辑，并把 generator 成功提示页从“显示真实文件名 / provider”改成仅显示 jobId、角色、动作、接收文件数和安全元数据状态

## 2026-04-25 22:43 PDT
- 继续向下收紧到 JSON API 响应体本身，发现 `/api/generator` 的 JSON 模式此前仍会返回 `provider`、`notes`、真实文件名以及 `workerPayload.provider`，这对直接调接口的人仍属于多余暴露
- 已在 `frontend/src/app/api/generator/route.ts` 与 Hetzner `backend/intake_server.py` 增加 `sanitize_*_for_client` 输出，只向客户端返回最小必要字段：jobId、时间、状态、角色、动作、帧数、intent、`asset-1` 风格抽象资源标签、大小、类型、以及下一步状态说明

## 2026-04-25 17:58 PDT
- 已开始把最新一轮 `/pipeline` persistent 来源追踪升级部署到 Vercel production
- 这次线上更新的重点不是新入口，而是把 pipeline 页面对于 persistent queue / result / source 的可见性同步到真实线上站点，避免本地有、线上没有
- `/pipeline` 顶部现在会直接显示“最近一次线上接收”面板，即使本地 queue 目录还没同步，也能看见刚刚上传了什么
- 这相当于先做出一层前端结果回流，让素材上传后的可见性不再完全依赖本地 worker 与 queue 文件
- 下一步：继续把这层前端回流替换成真正的线上持久化/worker 回流

## 2026-04-25 08:43 PDT
- 已重新打开首页入口边界：`/` 现在不再把 generator/pipeline 藏起来，而是直接提供“战斗素材上传”和“制图追踪台”两个主入口
- 这一步是为了匹配当前最高优先级，减少用户还得记路径或猜模块位置的摩擦
- 现在试玩、上传、追踪三条主链路都能从首页直接进入，更接近真实生产态工作流
- 下一步：继续把前端回流升级为真实持久化，再让 pipeline 真正消费线上上传结果

## 2026-04-25 09:22 PDT
- 已检查旧项目 `aetherlan-war` 的 Vercel 环境，当前没有现成的 KV / Blob / Postgres / Redis 之类可直接用于上传结果持久化的线上存储配置
- 因此当前最务实的结论是： hosted flow 仍然是“线上接收 + 可见确认 + 前端回流”，还不是完整自动生产管线
- 已补 `frontend/src/app/api/generator/README.md`，明确记录当前已打通和未打通的边界，以及下一步推荐的存储方案（Blob / DB / 外部 worker）
- 这样后续继续接存储或 worker 时，不会再重复踩“以为线上已经全自动”的认知坑

## 2026-04-25 09:24 PDT
- 已继续把这条边界直接体现在 UI 文案里，而不是只写在 README：首页、generator、pipeline 三处说明都已更新
- 现在前端会更明确地表达当前状态：上传接收和回显已打通，但完整自动去背景/拆帧/图集化仍需线上持久化与 worker
- 这一步减少了“用户看到成功页就以为后端已全自动”的认知偏差，也为后续接真正存储前提供了更稳定的产品预期

## 2026-04-25 11:42 PDT
- 已继续增强 `/pipeline` 顶部的“最近一次线上接收”区块，不再只是展示字段，而是补成可直接转交给人工/后续 worker 的 handoff card
- 这张卡片会用结构化文本列出 `jobId / role / action / provider / uploadCount / uploadNames / status / nextStep`，方便在当前无线上持久化时仍然把接收结果往后续处理链路传递
- 这一步虽然仍是过渡方案，但已经比单纯 query 回显更接近实际生产交接物

## 2026-04-25 12:08 PDT
- 已把 handoff card 再升级一层：`/pipeline` 现在除了人类可读文本卡片外，还会同步生成一份 worker-ready JSON payload 视图
- 这份 JSON 已标准化为 `jobId / role / action / provider / uploadCount / uploadNames / status / nextStep` 结构，后续接线上持久化或外部 worker 时可以直接沿用
- 这样当前这条 preview intake 链路已经同时兼顾“人看得懂”和“机器好消费”两个方向

## 2026-04-25 12:12 PDT
- 已把 worker payload 正式抽成共享 schema：新增 `frontend/src/lib/worker-payload.ts`
- 现在 `/api/generator` 和 `/pipeline` 不再各自手写 payload 结构，而是共用 `buildWorkerReadyPayload(...)` 与 `WorkerReadyPayload`
- 这一步把 preview intake 的数据格式从“页面约定”收口成“代码级约定”，后面接持久化或外部 worker 时更不容易漂字段
