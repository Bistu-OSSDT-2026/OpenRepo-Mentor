# OpenRepo Mentor 项目约定

## 定位

OpenRepo Mentor 是一个面向高校学生开源课程实践的轻量 CLI 工具。

## 目录结构

```
openrepo-mentor/
├── README.md
├── PRD.md
├── package.json
├── tsconfig.json
├── bin/           # CLI 入口
├── src/           # 源码
│   ├── cli/       # 命令行入口
│   ├── core/      # 业务逻辑
│   ├── llm/       # LLM 客户端与 Prompt
│   ├── output/    # 输出格式化
│   ├── config/    # 配置加载
│   ├── shared/    # 错误处理等共享模块
│   └── types/     # 共享类型
├── scripts/       # 构建脚本（如静态网站）
├── site-template/ # 静态网站模板
├── test/          # 测试
│   └── fixtures/  # 测试数据
└── docs/          # 项目文档
```

## 技术栈

- Node.js ≥22
- TypeScript
- Commander（CLI）
- Chalk（终端样式）
- Zod（配置校验）
- OpenAI SDK（智谱 Zhipu 兼容接口）
- Marked（Markdown 转 HTML）

## 命名规范

- 文件：`kebab-case.ts`
- 函数/变量：`camelCase`
- 类型/接口：`PascalCase`
- 常量：`SCREAMING_SNAKE_CASE`
- 命令文件与命令名一致：`scan.ts`, `issue.ts`, `plan.ts`, `report.ts`

## 代码规范

- 所有 LLM 调用必须通过 `src/llm/client.ts`。
- 命令之间通过 `.orm/*.json` 传递结构化数据。
- 错误使用 `OrmError`，并附带退出码。
- 测试使用 Node.js 内置 `node:test`。
- 使用 `--mock-llm` 支持无网络测试。

## 开发工作流

```bash
npm install      # 安装依赖
npm run build    # TypeScript 编译
npm run test:dev # 运行测试
npm run build:site # 构建静态网站
```

## 提交规范

使用 Angular 风格提交信息：

```
feat(scope): description
test(scope): description
docs(scope): description
fix(scope): description
```

例如：

```
feat(scan): detect package manager from lock files
test(analyzer): add mock mode test
```

## 安全红线

- API Key 只放在 `.ormrc` 或环境变量中，不进代码、不进 commit。
- `.ormrc` 已在 `.gitignore` 中。

## 文档位置

- PRD：`PRD.md`
- 设计规格：`docs/design-spec.md`
- 实施计划：`docs/implementation-plan.md`
- 用户指南：`docs/user-guide.md`
- 开发文档：`docs/development.md`
