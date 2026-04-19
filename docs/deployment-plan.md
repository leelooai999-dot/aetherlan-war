# Deployment Plan - 埃瑟兰战记：星尘之绊

## 当前状态
- 前端：Next.js 静态页面可构建
- 页面：`/`、`/lore`、`/prototype`
- 原型交互：移动、攻击、回合切换、战斗日志
- 响应式：已做首轮手机/桌面适配

## 发布前需要完成
1. 整理项目目录，确保仅包含前端应用与必要文档
2. 初始化独立 Git 仓库（避免污染现有大仓库）
3. 首次提交
4. 连接 Vercel
5. 触发 Preview Deploy

## Vercel 建议配置
- Framework: Next.js
- Root Directory: `frontend`
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output: 默认 Next.js 输出

## 发布后下一步
- 增加角色详情页
- 增加章节选择页
- 增加战斗动画与技能范围高亮
- 接入正式素材（角色图 / logo / UI视觉）
