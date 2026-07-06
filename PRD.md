# OpenRepo Mentor 产品需求文档（PRD）

> 版本：v1.0  
> 日期：2026-07-02  
> 状态：待实现  
> 项目位置：`code/my/openrepo-mentor/`

---

## 1. 项目概述

OpenRepo Mentor 是一个面向高校学生开源课程实践的轻量 CLI 工具。

它**不是**通用 AI 编程助手，而是把下面这条开源实践流程固化成命令：

```
理解开源项目 → 分析 Issue → 生成贡献计划 → 输出实践报告
```

### 1.1 核心定位

- **目标用户**：第一次参与开源项目的高校学生。
- **使用场景**：开源课程小组实践、期末报告与答辩准备。
- **产品形态**：本地 CLI 工具 + 静态展示网站 + 项目文档。
- **设计原则**：轻量、可解释、可落地、一周半内可完成 MVP。

### 1.2 与 BabeL-O 的关系

本项目位于 BabeL-O 仓库内的独立子目录 `openrepo-mentor/` 中，以**独立轻量项目**形式实现。不继承 BabeL-O 的 Nexus / Runtime / TUI / MCP 等重型架构，仅在代码组织、文件扫描、LLM 调用等具体实现上参考 BabeL-O 的经验。

---

## 2. 目标用户与使用场景

### 2.1 目标用户

| 用户 | 特征 | 诉求 |
|---|---|---|
| 高校学生 | 第一次接触开源项目 | 快速理解项目结构和 Issue 内容 |
| 学生小组 | 3-5 人协作完成课程实践 | 明确分工、生成可提交的报告 |
| 课程助教/老师 | 检查学生实践过程 | 看到结构化的分析过程和计划 |

### 2.2 典型场景

1. 学生甲选了一个开源项目，运行 `orm scan ./repo` 生成项目概览。
2. 学生乙找到感兴趣 Issue，运行 `orm issue analyze ./issue.md` 判断难度和相关文件。
3. 小组共同运行 `orm plan` 生成贡献计划。
4. 期末运行 `orm report` 生成课程实践报告草稿，再补充实现细节。

---

## 3. 成功标准

- 4 个核心命令在一周半内可稳定运行。
- 学生能在 30 分钟内完成对陌生项目的初步扫描和 Issue 分析。
- 最终能输出可直接用于课程报告和答辩的 Markdown 材料。
- 静态网站能展示项目介绍、功能说明和 Demo。
- 基础测试覆盖核心扫描规则和 LLM 调用 mock 路径。

---

## 4. MVP 功能范围

### 4.1 包含功能

- `orm scan <repo-path>`：项目扫描与概览生成。
- `orm issue analyze <issue-file>`：Issue 内容分析与难度判断。
- `orm plan`：基于扫描和 Issue 分析生成贡献计划。
- `orm report`：汇总生成课程实践报告草稿。
- 静态网站生成脚本。
- README、用户指南、开发文档。

### 4.2 明确不做

为保证一周半内稳定交付，以下功能在 MVP 中**不做**：

- 自动修改代码。
- 自动提交 PR / GitHub App。
- 复杂 Web 后台 / 多用户系统。
- 独立的自动自检命令（自检功能以 `orm report` 中的**手动自检清单**形式出现）。
- 多 LLM Provider 切换（MVP 仅支持智谱 Zhipu API）。

---

## 5. 命令详细设计

### 5.1 CLI 入口

```bash
orm scan <repo-path>            # 扫描项目，输出项目概览
orm issue analyze <issue-file>  # 分析 Issue，输出任务分析
orm plan                        # 基于 scan + issue 结果生成贡献计划
orm report                      # 汇总生成课程实践报告草稿
orm --version / -h              # 版本与帮助
```

全局选项：

- `--config <path>`：指定配置文件路径。
- `--verbose`：打印详细日志。
- `--mock-llm`：使用 mock LLM 响应，用于测试和无网络环境。

### 5.2 `orm scan <repo-path>`

**输入**：本地项目路径。  
**输出**：`.orm/scan-report.json` + `.orm/scan-report.md`。

| 分析项 | 说明 |
|---|---|
| 项目语言 | 按文件后缀统计，取前 3 种 |
| 技术栈 | 从 package.json / tsconfig.json / pyproject.toml 等推断 |
| 包管理器 | npm / yarn / pnpm / poetry / pip / 未知 |
| 构建命令 | 从 package.json scripts 中识别 build / compile / dist 等 |
| 测试命令 | 从 package.json scripts 中识别 test / spec 等 |
| 主要目录 | 列出顶层目录，过滤 node_modules / .git 等 |
| 关键文件 | README / LICENSE / CONTRIBUTING / CI 配置文件是否存在 |

### 5.3 `orm issue analyze <issue-file>`

**输入**：本地 Markdown Issue 文件路径。  
**输出**：`.orm/issue-analysis.json` + `.orm/issue-analysis.md`。

| 输出项 | 说明 |
|---|---|
| Issue 摘要 | 一句话概括问题 |
| 问题类型 | bug / feature / refactor / docs / question |
| 难度判断 | 简单 / 中等 / 困难 |
| 可能相关文件 | 基于关键词和仓库结构推断 |
| 建议解决步骤 | 分步骤的解决思路 |
| 风险点 | 学生可能遇到的坑 |

### 5.4 `orm plan`

**输入**：`.orm/scan-report.json` + `.orm/issue-analysis.json`。  
**输出**：`.orm/contribution-plan.md`。

| 输出项 | 说明 |
|---|---|
| 贡献目标 | 一句话说明要解决什么问题 |
| 背景说明 | 结合项目扫描结果说明项目背景 |
| 任务拆分 | 把 Issue 拆成 3-5 个可执行子任务 |
| 修改步骤 | 每个子任务对应的文件和代码修改方向 |
| 测试计划 | 如何验证修改是否正确 |
| PR 准备事项 | 提交前检查清单 |

### 5.5 `orm report`

**输入**：`.orm/` 下所有已生成的中间文件。  
**输出**：`.orm/final-report.md`。

| 输出项 | 说明 |
|---|---|
| 项目选择说明 | 为什么选择该项目 |
| 项目结构分析 | 引用 scan 结果 |
| Issue 分析 | 引用 issue 分析结果 |
| 贡献计划 | 引用 plan 结果 |
| 小组分工 | 支持 `--members` 参数或交互式输入 |
| 实现过程记录 | 留空模板，供学生手动填写 |
| 测试方式 | 引用 plan 中的测试计划 |
| 总结 | 留空模板 |
| 手动自检清单 | 学生对照检查 |

---

## 6. 架构与数据流

### 6.1 高层架构

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   CLI 命令   │────▶│  本地上下文收集  │────▶│  规则扫描 / 解析  │
└─────────────┘     └─────────────────┘     └──────────────────┘
                                                    │
                                                    ▼
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Markdown/   │◀────│  结果格式化输出  │◀────│  智谱 Zhipu API  │
│ JSON 输出   │     └─────────────────┘     └──────────────────┘
└─────────────┘
```

### 6.2 核心特点

- 不启动服务，不依赖 WebSocket，纯同步/异步 CLI 流程。
- 每个命令独立可运行。
- 中间结果以 `.orm/*.md` + `.orm/*.json` 落地，便于查看和调试。
- `plan` 和 `report` 读取前序命令产生的中间文件，不重复读取整个仓库。

### 6.3 模块关系

```
src/
├── cli/            # 命令行入口与命令注册
├── core/           # scan / analyze / plan / report 业务逻辑
├── llm/            # 智谱 API 客户端与 Prompt 模板
├── output/         # Markdown / JSON 输出格式化
├── config/         # 配置加载
└── types/          # 共享类型
```

---

## 7. 数据存储与配置

### 7.1 中间文件目录

默认在当前工作目录创建 `.orm/`：

```
.orm/
├── scan-report.json
├── scan-report.md
├── issue-analysis.json
├── issue-analysis.md
├── contribution-plan.md
└── final-report.md
```

所有 `.json` 文件用于命令间传递结构化数据，所有 `.md` 文件用于人工阅读和最终报告。

### 7.2 配置文件

支持配置文件 `.ormrc`（JSON 格式）或环境变量：

```json
{
  "provider": "zhipu",
  "apiKey": "<ZHIPU_API_KEY>",
  "model": "glm-4-flash",
  "baseURL": "https://open.bigmodel.cn/api/paas/v4/",
  "maxTokens": 4096
}
```

### 7.3 环境变量

- `ORM_ZHIPU_API_KEY`
- `ORM_MODEL`
- `ORM_MAX_TOKENS`

### 7.4 配置加载优先级

1. 命令行参数 `--config <path>`
2. 环境变量
3. `.ormrc`
4. 默认兜底（无 key 时报错退出）

---

## 8. LLM 集成

### 8.1 Provider：智谱 Zhipu

MVP 仅支持智谱 Zhipu API，使用 OpenAI-compatible 接口：

- 基础 URL：`https://open.bigmodel.cn/api/paas/v4/`
- SDK：使用 `openai` Node SDK，配置 `baseURL` 和 `apiKey`。
- 默认模型：`glm-4-flash`（成本低、速度快）；对质量要求高的场景可切换到 `glm-4-air`。

### 8.2 客户端封装

`src/llm/client.ts` 统一处理：

- API key 存在性校验。
- 请求重试（最多 3 次，指数退避）。
- Token / 费用估算日志（API 返回时打印）。
- Mock 模式（`--mock-llm`）返回本地固定响应，用于测试。

### 8.3 Prompt 管理

Prompt 模板放在 `src/llm/prompts/` 下，按命令分类：

```
src/llm/prompts/
├── scan.ts
├── issue.ts
├── plan.ts
└── report.ts
```

- 每个 Prompt 接收结构化上下文（JSON）。
- 采用“系统提示 + 用户输入”模式。
- 要求模型按指定格式返回 Markdown 或 JSON。
- Prompt 中明确约束输出长度和格式，避免无关内容。

### 8.4 成本控制

- `scan` 和 `issue analyze` 只传精简上下文（目录结构 + 关键文件片段）。
- `plan` 和 `report` 基于已生成的 `.md` 文件，避免重复读取整个仓库。
- 默认使用 `glm-4-flash`，降低成本。
- 输出每次调用 token 数，便于学生了解费用。

---

## 9. 静态网站

### 9.1 生成方式

- 脚本：`scripts/build-site.ts`
- 输入：`README.md`、`docs/` 目录、`orm report` 生成的 `.orm/final-report.md`
- 输出：`site/` 目录
- 技术：极简 HTML 模板 + `marked` 将 Markdown 转为 HTML
- 触发方式：
  - `orm report --site`：生成报告后自动构建网站
  - `npm run build:site`：手动构建

### 9.2 网站内容

| 页面 | 内容 |
|---|---|
| 首页 | 项目介绍、安装方式、功能概览 |
| 指南页 | 用户快速开始 |
| Demo 页 | 示例 scan / issue / plan / report 输出 |
| 报告页 | 最终课程实践报告 |

### 9.3 部署

网站为纯静态文件，可直接部署到 GitHub Pages、Vercel、Netlify 或任何静态托管服务。

---

## 10. 错误处理与日志

### 10.1 退出码

| 退出码 | 含义 | 示例 |
|---|---|---|
| 0 | 成功 | |
| 1 | 缺少 API key | 未设置 `ORM_ZHIPU_API_KEY` |
| 2 | 输入路径不存在 | `orm scan ./不存在的路径` |
| 3 | 前置结果缺失 | 未运行 scan/issue 就执行 plan/report |
| 4 | LLM 调用失败 | 重试 3 次后仍失败 |
| 5 | 输出目录不可写 | `.orm/` 无写入权限 |

### 10.2 日志

- 默认输出简洁，仅显示关键进度和最终保存路径。
- `--verbose` 打印详细日志：读取文件、调用 LLM、token 数、重试信息。
- 错误信息使用中英文双语，方便调试。

---

## 11. 测试策略

### 11.1 单元测试

- 框架：Node.js 内置 `node:test` + `node:assert`。
- 覆盖范围：
  - 项目扫描规则（语言识别、包管理器检测、关键文件存在性）。
  - 配置加载优先级。
  - Prompt 模板渲染（输入结构化数据，检查输出包含关键字段）。
  - Markdown / JSON 输出格式化。

### 11.2 集成测试

- 使用固定 fixtures：
  - `test/fixtures/sample-project/`：模拟开源项目。
  - `test/fixtures/sample-issue.md`：模拟 Issue。
- 跑完整流程：`scan → issue analyze → plan → report`。
- LLM 调用必须可 mock：通过 `--mock-llm` 或环境变量跳过真实 API 调用。

### 11.3 手工测试

- 在 2-3 个真实开源仓库上验证 `orm scan` 输出。
- 在 2 个真实 Issue 上验证 `orm issue analyze` 输出。

---

## 12. 项目结构

```
openrepo-mentor/
├── README.md
├── package.json
├── tsconfig.json
├── bin/
│   └── orm.js                  # CLI 入口
├── src/
│   ├── index.ts
│   ├── cli/
│   │   ├── program.ts          # commander 命令注册
│   │   └── commands/
│   │       ├── scan.ts
│   │       ├── issue.ts
│   │       ├── plan.ts
│   │       └── report.ts
│   ├── core/
│   │   ├── scanner.ts          # 项目扫描
│   │   ├── analyzer.ts         # Issue 分析
│   │   ├── planner.ts          # 贡献计划
│   │   └── reporter.ts         # 报告生成
│   ├── llm/
│   │   ├── client.ts
│   │   └── prompts/
│   │       ├── scan.ts
│   │       ├── issue.ts
│   │       ├── plan.ts
│   │       └── report.ts
│   ├── output/
│   │   ├── writer.ts
│   │   └── formatter.ts
│   ├── config/
│   │   └── loader.ts
│   └── types/
│       └── index.ts
├── scripts/
│   └── build-site.ts
├── docs/
│   ├── user-guide.md
│   └── development.md
├── test/
│   ├── fixtures/
│   │   ├── sample-project/
│   │   └── sample-issue.md
│   └── *.test.ts
└── site-template/
    └── index.html
```

---

## 13. 开发里程碑

### M1：项目基础与项目扫描

- [ ] 初始化 `openrepo-mentor/` 项目结构（package.json、tsconfig、CLI 入口）。
- [ ] 实现配置加载（`.ormrc` + 环境变量）。
- [ ] 实现 `orm scan <repo-path>`。
- [ ] 编写 README 和用户快速开始文档。
- [ ] 为 scan 添加单元测试。

### M2：Issue 分析与计划生成

- [ ] 接入智谱 Zhipu API，封装 LLM 客户端。
- [ ] 实现 `orm issue analyze <issue-file>`。
- [ ] 实现 `orm plan`。
- [ ] 编写 Prompt 模板并稳定输出格式。
- [ ] 添加 LLM mock 模式用于测试。
- [ ] 添加集成测试 fixtures。

### M3：报告、网站与收尾

- [ ] 实现 `orm report`。
- [ ] 实现静态网站生成脚本 `scripts/build-site.ts`。
- [ ] 编写开发文档。
- [ ] 补充单元测试和集成测试。
- [ ] 准备 Demo 示例和最终课程报告材料。

---

## 14. 风险与依赖

| 风险 | 影响 | 应对 |
|---|---|---|
| 智谱 API 访问不稳定 | LLM 命令无法运行 | 支持 `--mock-llm` 模式，测试不依赖网络 |
| LLM 输出格式不稳定 | plan/report 结构混乱 | Prompt 明确要求结构化输出，失败时重试并给出降级模板 |
| 一周半时间紧张 | 功能做不完 | 严格控制 MVP 范围，砍掉非核心功能 |
| 小组 5 人协作冲突 | 接口不一致 | 提前约定 `.json` 中间文件 schema 和模块边界 |
| 学生机器无 Node.js 22 | 无法运行 | 文档说明环境要求，提供 nvm 安装指引 |

---

## 15. 小组分工建议（答辩导向）

按“每人答辩时讲自己实现的部分”分配，确保每人都有明确的代码模块和可演示的命令。

| 成员 | 负责模块 | 答辩内容 | 主要产出 |
|---|---|---|---|
| 姚权秩 | 项目初始化 + CLI 框架 + 配置加载 + 错误处理 | 整体架构、命令注册、配置加载、错误码设计 | `package.json`、`tsconfig.json`、`cli/program.ts`、`config/loader.ts`、`shared/errors.ts`、README |
| 徐泽铖 | 静态网站 + 项目文档 + Demo 素材 | 项目官网、报告页面、Demo 展示 | `site-template/`、`scripts/build-site.ts`、Demo 示例 |
| 白一百 | `orm scan` | 演示扫描陌生项目，讲解项目结构识别 | `cli/commands/scan.ts`、`core/scanner.ts`、`llm/prompts/scan.ts`、scanner 测试 |
| 王冬岩 | `orm issue analyze` | 演示分析 Issue，讲解难度判断和相关文件推断 | `cli/commands/issue.ts`、`core/analyzer.ts`、`llm/prompts/issue.ts`、analyzer 测试 |
| 许琢章 | `orm plan` + `orm report` + LLM 客户端 + 集成测试 | 演示生成贡献计划和最终报告，讲解 LLM 调用和 mock 测试 | `llm/client.ts`、`cli/commands/plan.ts`、`core/planner.ts`、`cli/commands/report.ts`、`core/reporter.ts`、集成测试 |

---

## 16. 课程要求对应

| 课程要求 | 对应实现 |
|---|---|
| 项目计划 | `PRD.md`、里程碑计划、进度表 |
| 网站建设 | `scripts/build-site.ts` 生成的静态网站 |
| 编程开发 | 4 个 CLI 命令 |
| 配置管理 | Git 规范、npm scripts、TypeScript 配置、测试配置 |
| 文档编制 | README、用户指南、开发文档、最终报告 |

---

## 17. 一句话总结

OpenRepo Mentor 不是让 AI 自动替学生完成开源贡献，而是把“理解项目、分析 Issue、制定计划、生成报告”这条开源实践流程做成工具，帮助学生更规范、更高效地完成课程开源实践。
