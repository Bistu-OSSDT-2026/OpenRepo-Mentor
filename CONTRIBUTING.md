# 贡献指南

感谢你对 OpenRepo Mentor 感兴趣！本项目是一个面向高校开源课程实践的轻量 CLI 工具。无论你是修复 bug、改进文档还是添加新命令，都欢迎提交贡献。

## 目录

- [开发环境](#开发环境)
- [项目结构](#项目结构)
- [工作流](#工作流)
- [提交信息规范](#提交信息规范)
- [代码规范](#代码规范)
- [测试](#测试)
- [提交 PR](#提交-pr)
- [报告问题](#报告问题)

---

## 开发环境

- Node.js ≥ 22
- npm

```bash
cd openrepo-mentor
npm install
npm run build
npm run test:dev
```

---

## 项目结构

```text
bin/              CLI 可执行入口
docs/             设计与用户文档
scripts/          独立构建脚本（静态网站）
site-template/    静态网站模板
src/              CLI 与核心源码
  cli/            命令注册与命令处理
  core/           业务逻辑（scan / analyze / plan / report）
  llm/            智谱 LLM 客户端与 Prompt
  output/         Markdown / JSON 输出
  config/         配置加载
  shared/         错误处理等共享模块
  types/          共享类型
test/             测试用例与 fixtures
```

---

## 工作流

1. **Fork 仓库**（如果你是外部贡献者）。
2. **创建分支**：从 `main` 切出新分支。
3. **修改代码**。
4. **运行测试和构建**。
5. **提交 PR**。

推荐的分支命名：

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
test/<short-description>
refactor/<short-description>
```

例如：

```text
feat(scan): detect pnpm workspace
fix(analyzer): handle truncated llm output
docs(readme): add install examples
```

---

## 提交信息规范

使用 Angular 风格提交信息：

```text
<type>(<scope>): <subject>
```

常用类型：

| 类型 | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档变更 |
| `test` | 测试相关 |
| `refactor` | 重构（不修改行为） |
| `chore` | 构建/工具/依赖调整 |

示例：

```text
feat(scan): detect package manager from lock files
fix(analyzer): strengthen prompt for json output
test(planner): add mock mode test
docs(contributing): add contribution guidelines
```

---

## 代码规范

- 文件命名：`kebab-case.ts`
- 函数/变量：`camelCase`
- 类型/接口：`PascalCase`
- 常量：`SCREAMING_SNAKE_CASE`
- 命令文件与命令名一致：`scan.ts`、`issue.ts`、`plan.ts`、`report.ts`

其他约定：

- 所有 LLM 调用必须通过 `src/llm/client.ts`。
- 命令之间通过 `.orm/*.json` 传递结构化数据。
- 错误使用 `OrmError`，并附带合适的退出码。
- 不要直接在各命令里发起 HTTP 请求。

---

## 测试

所有变更都应通过测试。

```bash
# 开发时快速测试（基于 TypeScript 源码）
npm run test:dev

# 构建后测试（基于 dist/）
npm run build
npm run test
```

涉及 LLM 的测试请使用 mock 模式，避免真实 API 调用和费用：

```bash
orm scan ./repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm
```

---

## 提交 PR

1. 确保 `npm run build` 和 `npm run test:dev` 都通过。
2. 如果是新功能，请在 `docs/` 或 `README.md` 中补充相关说明。
3. PR 描述中说明：
   - 解决了什么问题
   - 主要改动点
   - 如何验证
4. 等待 review 后再合并。

---

## 报告问题

如果你发现了 bug 或有功能建议，欢迎提交 Issue。请尽量包含：

- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 运行环境（Node.js 版本、操作系统）
- 相关日志或错误信息

---

## 安全提醒

- 不要将 API Key、token、密码提交到仓库。
- 本地配置请使用 `.ormrc` 或环境变量，这两类文件已在 `.gitignore` 中忽略。

再次感谢你的贡献！
