# OpenRepo Mentor 设计规格书（Design Spec）

> 对应 PRD：`PRD.md`  
> 日期：2026-07-02  
> 版本：v1.0  
> 状态：PRD 已确认，待生成实施计划

---

## 1. 设计目标

将 PRD 中定义的 4 个 CLI 命令、静态网站生成、配置管理和测试策略转化为可实现的技术规格，明确模块边界、数据格式、接口契约和协作顺序，确保 5 人小组在一周半内可并行推进。

---

## 2. 高层架构

### 2.1 运行模式

纯本地 Node.js CLI，无服务、无 WebSocket、无持久数据库。所有状态通过文件系统落地：

```
用户命令 → 本地上下文收集 → LLM 调用（智谱） → 格式化输出 → .orm/ 文件
```

### 2.2 分层

| 层级 | 职责 | 代表文件 |
|---|---|---|
| CLI 层 | 命令解析、参数校验、调用 core | `cli/program.ts`, `cli/commands/*.ts` |
| Core 层 | 业务逻辑：扫描、分析、计划、报告 | `core/scanner.ts`, `core/analyzer.ts`, `core/planner.ts`, `core/reporter.ts` |
| LLM 层 | 智谱 API 封装、Prompt 渲染 | `llm/client.ts`, `llm/prompts/*.ts` |
| Output 层 | Markdown / JSON 读写、格式化 | `output/writer.ts`, `output/formatter.ts` |
| Config 层 | 配置加载与校验 | `config/loader.ts` |

---

## 3. 模块设计

### 3.1 CLI 层

#### `cli/program.ts`

- 使用 `commander` 注册命令和全局选项。
- 全局选项：`--config`, `--verbose`, `--mock-llm`。
- 每个命令的 action 负责：
  1. 加载配置。
  2. 调用对应 core 函数。
  3. 处理错误并退出。

#### `cli/commands/scan.ts`

```ts
export async function scanCommand(repoPath: string, options: GlobalOptions): Promise<void>
```

- 校验路径存在。
- 调用 `scanner.scanRepo(repoPath)`。
- 调用 `writer.writeScanReport(result)` 写入 `.orm/scan-report.{md,json}`。

#### `cli/commands/issue.ts`

```ts
export async function issueAnalyzeCommand(issueFile: string, options: GlobalOptions): Promise<void>
```

- 校验文件存在。
- 读取 issue markdown。
- 如果 `.orm/scan-report.json` 存在，则一并传入上下文。
- 调用 `analyzer.analyzeIssue(issueContent, scanResult?)`。
- 写入 `.orm/issue-analysis.{md,json}`。

#### `cli/commands/plan.ts`

```ts
export async function planCommand(options: GlobalOptions): Promise<void>
```

- 读取 `.orm/scan-report.json` 和 `.orm/issue-analysis.json`。
- 缺失时报错退出（退出码 3）。
- 调用 `planner.generatePlan(scanResult, issueResult)`。
- 写入 `.orm/contribution-plan.md`。

#### `cli/commands/report.ts`

```ts
export async function reportCommand(options: GlobalOptions & { site?: boolean; members?: string }): Promise<void>
```

- 读取 `.orm/` 下所有中间文件。
- 缺失时报错退出（退出码 3）。
- 调用 `reporter.generateReport(context)`。
- 写入 `.orm/final-report.md`。
- 如果 `--site`，调用 `buildSite()`。

### 3.2 Core 层

#### `core/scanner.ts`

职责：收集本地项目元数据。

关键函数：

```ts
export interface ScanResult {
  repoPath: string;
  languages: Array<{ name: string; percentage: number }>;
  techStack: string[];
  packageManager: string;
  buildCommand?: string;
  testCommand?: string;
  topLevelDirectories: string[];
  keyFiles: {
    readme: boolean;
    license: boolean;
    contributing: boolean;
    ci: boolean;
  };
}

export async function scanRepo(repoPath: string): Promise<ScanResult>
```

实现要点：
- 使用 `fs.readdir` / `fs.stat` 遍历顶层目录。
- 使用 `glob` 或简单递归统计文件后缀（不引入额外依赖，可用 `fs` + 正则）。
- 读取 `package.json`、`tsconfig.json`、`pyproject.toml` 等关键文件。
- 过滤 `node_modules`、`.git`、`dist`、`build` 等目录。

#### `core/analyzer.ts`

职责：调用 LLM 分析 Issue。

```ts
export interface IssueAnalysis {
  summary: string;
  type: 'bug' | 'feature' | 'refactor' | 'docs' | 'question';
  difficulty: 'easy' | 'medium' | 'hard';
  relatedFiles: string[];
  suggestedSteps: string[];
  risks: string[];
}

export async function analyzeIssue(
  issueContent: string,
  scanResult?: ScanResult,
  options: { mock?: boolean } = {}
): Promise<IssueAnalysis>
```

实现要点：
- 渲染 `issue-prompt`。
- 调用 `llmClient.complete()`。
- 解析返回的 JSON（Prompt 要求 JSON 格式）。
- 校验字段完整性，缺失时重试一次。

#### `core/planner.ts`

职责：基于 scan 和 issue 生成贡献计划。

```ts
export interface ContributionPlan {
  goal: string;
  background: string;
  tasks: Array<{ title: string; description: string; files?: string[] }>;
  testPlan: string;
  prChecklist: string[];
}

export async function generatePlan(
  scanResult: ScanResult,
  issueResult: IssueAnalysis,
  options: { mock?: boolean } = {}
): Promise<ContributionPlan>
```

#### `core/reporter.ts`

职责：汇总所有中间结果生成最终报告。

```ts
export interface ReportInput {
  scanResult: ScanResult;
  issueResult: IssueAnalysis;
  planResult: ContributionPlan;
  members?: string[];
}

export async function generateReport(input: ReportInput): Promise<string>
```

返回 Markdown 字符串，由 `output/writer.ts` 写入文件。

### 3.3 LLM 层

#### `llm/client.ts`

```ts
export interface LLMConfig {
  provider: 'zhipu';
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
}

export interface LLMClient {
  complete(prompt: { system: string; user: string }): Promise<string>;
}

export function createLLMClient(config: LLMConfig, options?: { mock?: boolean }): LLMClient
```

实现要点：
- 使用 `openai` SDK，配置 `baseURL` 为智谱 endpoint。
- `mock` 模式返回本地预置字符串，不发起网络请求。
- 失败时重试 3 次，指数退避（1s, 2s, 4s）。
- 打印 token 使用（如果 API 返回）。

#### `llm/prompts/*.ts`

每个 Prompt 文件导出一个函数：

```ts
export function renderIssuePrompt(issueContent: string, scanResult?: ScanResult): { system: string; user: string }
```

Prompt 要求：
- 系统提示中明确模型角色和输出格式。
- 用户提示中给出上下文和任务。
- 要求输出合法 JSON，并用代码块包裹方便解析。

### 3.4 Output 层

#### `output/writer.ts`

```ts
export const ORM_DIR = '.orm';

export async function writeScanReport(result: ScanResult): Promise<void>
export async function writeIssueAnalysis(result: IssueAnalysis): Promise<void>
export async function writePlan(plan: ContributionPlan): Promise<void>
export async function writeReport(markdown: string): Promise<void>
```

每个函数同时写入 `.json`（如果适用）和 `.md`。

#### `output/formatter.ts`

- `formatScanReport(result): string`：生成 Markdown。
- `formatIssueAnalysis(result): string`：生成 Markdown。
- `formatPlan(plan): string`：生成 Markdown。

### 3.5 Config 层

#### `config/loader.ts`

```ts
export interface AppConfig {
  provider: 'zhipu';
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
}

export async function loadConfig(options: { configPath?: string }): Promise<AppConfig>
```

加载顺序：
1. 默认配置：`provider: 'zhipu'`, `model: 'glm-4-flash'`, `baseURL: 'https://open.bigmodel.cn/api/paas/v4/'`, `maxTokens: 4096`。
2. 从 `--config` 指定的文件加载。
3. 从 `.ormrc` 加载。
4. 从环境变量 `ORM_ZHIPU_API_KEY`、`ORM_MODEL`、`ORM_MAX_TOKENS` 覆盖。

如果最终 `apiKey` 为空，抛出错误。

---

## 4. 数据格式

### 4.1 `.orm/scan-report.json`

```json
{
  "repoPath": "/abs/path/to/repo",
  "languages": [
    { "name": "TypeScript", "percentage": 78.5 },
    { "name": "JavaScript", "percentage": 15.2 }
  ],
  "techStack": ["Node.js", "TypeScript", "commander", "chalk"],
  "packageManager": "npm",
  "buildCommand": "npm run build",
  "testCommand": "npm test",
  "topLevelDirectories": ["src", "test", "docs"],
  "keyFiles": {
    "readme": true,
    "license": true,
    "contributing": false,
    "ci": true
  }
}
```

### 4.2 `.orm/issue-analysis.json`

```json
{
  "summary": "修复 CLI 在 Windows 下的路径分隔符问题",
  "type": "bug",
  "difficulty": "medium",
  "relatedFiles": ["src/cli/pathMention.ts", "src/shared/config.ts"],
  "suggestedSteps": [
    "复现问题并确认路径拼接位置",
    "将硬编码 '/' 改为 path.sep",
    "添加 Windows 路径单元测试"
  ],
  "risks": [
    "可能影响 POSIX 系统路径解析",
    "需要额外测试 cygwin / WSL 环境"
  ]
}
```

### 4.3 `.orm/contribution-plan.md`

Markdown 文件，包含 PRD 中定义的章节。

### 4.4 `.orm/final-report.md`

Markdown 文件，包含 PRD 中定义的章节，部分为留空模板。

---

## 5. Prompt 设计规范

### 5.1 通用要求

1. 系统提示定义模型角色（开源项目导师）。
2. 用户提示给出具体任务、输入格式和期望输出格式。
3. 要求输出合法 JSON，字段必须完整。
4. 使用中文输出，因为目标用户是中文学生。

### 5.2 Issue 分析 Prompt 示例

**System:**

```
你是一名开源项目导师，擅长帮助学生理解 Issue 内容。请根据提供的 Issue 文本和项目扫描结果，输出一份结构化的 JSON 分析。输出必须是合法 JSON，不要包含任何解释性文字。
```

**User:**

```
【项目扫描结果】
{{scanReportMarkdown}}

【Issue 内容】
{{issueContent}}

请输出以下 JSON 格式：
{
  "summary": "一句话摘要",
  "type": "bug | feature | refactor | docs | question",
  "difficulty": "easy | medium | hard",
  "relatedFiles": ["可能的文件路径"],
  "suggestedSteps": ["步骤1", "步骤2"],
  "risks": ["风险1"]
}
```

---

## 6. 静态网站

### 6.1 脚本

`scripts/build-site.ts`：

1. 读取 `README.md`。
2. 读取 `docs/user-guide.md` 和 `docs/development.md`。
3. 读取 `.orm/final-report.md`（如果存在）。
4. 使用 `marked` 转换为 HTML。
5. 应用 `site-template/index.html` 的模板样式。
6. 输出到 `site/`。

### 6.2 模板

`site-template/index.html` 是一个极简单页模板，包含：
- 导航栏
- 内容区域（由脚本注入转换后的 HTML）
- 基础 CSS（响应式、代码高亮）

### 6.3 触发

- `orm report --site`
- `npm run build:site`

---

## 7. 错误处理

### 7.1 错误类型

定义在 `src/shared/errors.ts`：

```ts
export class OrmError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

export const ErrorCodes = {
  MISSING_API_KEY: 1,
  PATH_NOT_FOUND: 2,
  MISSING_PREREQUISITE: 3,
  LLM_CALL_FAILED: 4,
  OUTPUT_WRITE_FAILED: 5,
} as const;
```

### 7.2 处理流程

- Core 层抛出 `OrmError`。
- CLI 层 catch 后打印错误信息并调用 `process.exit(code)`。

---

## 8. 测试策略

### 8.1 测试目录

```
test/
├── fixtures/
│   ├── sample-project/
│   │   ├── package.json
│   │   ├── src/
│   │   └── test/
│   └── sample-issue.md
├── scanner.test.ts
├── analyzer.test.ts
├── planner.test.ts
├── reporter.test.ts
├── config.test.ts
└── integration.test.ts
```

### 8.2 Mock 模式

- LLM 客户端支持 `mock: true`。
- 集成测试使用 mock 响应，避免真实 API 调用。

### 8.3 关键测试用例

| 模块 | 用例 |
|---|---|
| scanner | 正确识别 TS/JS 项目；正确过滤 node_modules；正确读取 package.json scripts |
| analyzer | mock 返回合法 JSON；缺失字段时重试；非法 JSON 时报错 |
| planner | 输出包含目标、任务拆分、测试计划 |
| reporter | 汇总所有输入；生成包含所有章节的 report |
| config | 加载优先级正确；缺失 key 时报错 |
| integration | scan → issue → plan → report 完整流程 |

---

## 9. 开发工作流

### 9.1 Scripts

```json
{
  "scripts": {
    "dev": "tsx src/cli/program.ts",
    "build": "tsc -p tsconfig.json",
    "test": "node --test dist/test/*.test.js",
    "test:dev": "tsx --test test/*.test.ts",
    "build:site": "tsx scripts/build-site.ts"
  }
}
```

### 9.2 依赖

核心依赖：
- `commander`
- `chalk`
- `zod`
- `openai`（用于智谱兼容 API）
- `marked`（静态网站）

开发依赖：
- `typescript`
- `tsx`
- `@types/node`

---

## 10. 里程碑与任务分配

### 10.1 里程碑

| 里程碑 | 目标 | 交付物 |
|---|---|---|
| **M1** | 项目基础与项目扫描 | 可运行的 `orm scan`，README，用户指南 |
| **M2** | Issue 分析与计划生成 | `orm issue analyze`、`orm plan`、Prompt 模板、集成测试 fixtures |
| **M3** | 报告、网站与收尾 | `orm report`、静态网站、开发文档、完整测试、Demo |

### 10.2 五人任务分配（答辩导向）

按“每人答辩时讲自己实现的部分”重新分配，确保每人都有明确的代码模块和可演示的命令。

#### 成员 姚权秩：项目初始化 + CLI 框架 + 配置加载 + 错误处理

- **答辩内容**：整体架构、命令注册、配置加载、错误码设计。
- **主要任务**：
  - 初始化项目结构和 `package.json`、`tsconfig.json`。
  - 实现 `cli/program.ts`，注册 4 个命令。
  - 实现 `config/loader.ts`。
  - 实现 `shared/errors.ts` 和退出码机制。
  - 定义 `.json` 中间文件 schema 和共享类型 `src/types/index.ts`。
  - 编写 README 和用户指南。
- **协作接口**：提供命令注册框架、配置对象、schema，供 白一百/王冬岩/许琢章 在各自命令中使用。

#### 成员 徐泽铖：静态网站 + 项目文档 + Demo 素材

- **答辩内容**：项目官网、报告页面、Demo 展示。
- **主要任务**：
  - 编写 `site-template/index.html` 和基础 CSS。
  - 实现 `scripts/build-site.ts`。
  - 准备 Demo 示例（示例项目、示例 Issue、示例输出）。
  - 确保网站可在 GitHub Pages / Vercel 部署。
- **协作接口**：依赖 `.orm/final-report.md` 和 `docs/*.md`。

#### 成员 白一百：`orm scan`

- **答辩内容**：演示扫描一个陌生项目，讲解项目结构识别逻辑。
- **主要任务**：
  - 实现 `cli/commands/scan.ts`。
  - 实现 `core/scanner.ts`。
  - 编写 `llm/prompts/scan.ts`（如果需要 LLM 辅助总结）。
  - 编写 `test/scanner.test.ts`。
- **协作接口**：输出 `.orm/scan-report.{md,json}`。

#### 成员 王冬岩：`orm issue analyze`

- **答辩内容**：演示分析一个 Issue，讲解难度判断和相关文件推断。
- **主要任务**：
  - 实现 `cli/commands/issue.ts`。
  - 实现 `core/analyzer.ts`。
  - 编写 `llm/prompts/issue.ts`。
  - 编写 `test/analyzer.test.ts`。
- **协作接口**：读取 `.orm/scan-report.json`（可选），输出 `.orm/issue-analysis.{md,json}`。

#### 成员 许琢章：`orm plan` + `orm report` + LLM 客户端 + 集成测试

- **答辩内容**：演示生成贡献计划和最终报告，讲解 LLM 调用和 mock 测试。
- **主要任务**：
  - 实现 `llm/client.ts`（智谱 API 封装、mock 模式、重试）。
  - 实现 `cli/commands/plan.ts` 和 `core/planner.ts`。
  - 实现 `cli/commands/report.ts` 和 `core/reporter.ts`。
  - 编写 `llm/prompts/plan.ts` 和 `llm/prompts/report.ts`。
  - 编写 `test/integration.test.ts`。
- **协作接口**：读取 scan/issue 结果，输出 plan/report；所有 LLM 调用通过此客户端。

### 10.3 协作顺序

**M1：基础 + scan**

- 姚权秩：搭项目框架、CLI 命令注册、配置加载、错误处理。
- 白一百：实现 `orm scan`。
- 许琢章：实现 LLM 客户端（含 mock 模式），供 M2 使用。
- 徐泽铖：准备网站模板。
- 王冬岩：准备 Issue fixtures。

**M2：Issue 分析 + Plan**

- 王冬岩：实现 `orm issue analyze`。
- 许琢章：实现 `orm plan`。
- 白一百：补充 scan 测试。
- 姚权秩：补充文档和输出格式化工具。
- 徐泽铖：实现 Markdown 转 HTML。

**M3：Report + 网站 + 收尾**

- 许琢章：实现 `orm report`、集成测试。
- 徐泽铖：接入 `.orm/final-report.md` 生成完整网站。
- 王冬岩：补充 issue 测试。
- 姚权秩：完善 README、用户指南、错误处理。
- 全组：联调、修 bug、准备 Demo。

### 10.4 关键接口约定

- `.orm/scan-report.json` schema 由 姚权秩 定义，白一百 生成。
- `.orm/issue-analysis.json` schema 由 姚权秩 定义，王冬岩 生成。
- `core/planner.ts` 输入为上述两个 JSON 对象。
- `core/reporter.ts` 输入为 scan + issue + plan 结果。
- 所有 LLM 调用通过 `llm/client.ts`，禁止各命令直接发起 HTTP 请求。

---

## 11. 待实施计划生成

本 Spec 确认后，下一步调用 `superpowers:writing-plans` 生成详细实施计划，包括每个文件的具体实现步骤、测试命令和验证方式。
