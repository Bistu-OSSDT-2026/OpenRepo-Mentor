# OpenRepo Mentor 实施计划

> **面向代理工作者：** 必需子技能：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务逐个实施本计划。步骤使用复选框（`- [ ]`）语法以便跟踪。

**目标：** 在 `openrepo-mentor/` 目录下构建一个轻量 CLI 工具 `orm`，包含四个命令（`scan`、`issue analyze`、`plan`、`report`）、一个静态网站生成器和测试，使用智谱 Zhipu LLM API。

**架构：** 一个纯本地 Node.js CLI，收集项目上下文，通过 OpenAI 兼容接口调用智谱，将中间结果写入 `.orm/*.json` 和 `.orm/*.md`。无服务、无数据库、无 WebSocket。每个命令读取前一步输出以生成下一个产物。

**技术栈：** Node.js ≥22、TypeScript、`commander`、`chalk`、`zod`、`openai`（用于智谱兼容）、`marked`、`node:test`。

## 全局约束

- Node.js 版本：`>=22`。
- 包管理器：`npm`。
- 所有代码位于 `openrepo-mentor/` 内，作为独立项目。
- 不使用 React/Ink、Fastify、WebSocket、SQLite、MCP。
- LLM Provider：智谱（`https://open.bigmodel.cn/api/paas/v4/`），默认模型 `glm-4-flash`。
- 配置方式：`.ormrc` JSON 文件或环境变量 `ORM_ZHIPU_API_KEY`、`ORM_MODEL`、`ORM_MAX_TOKENS`。
- 所有 LLM 调用通过 `src/llm/client.ts`；命令不直接发起 HTTP 请求。
- 所有中间输出写入 `.orm/`。
- 测试使用内置 `node:test`；LLM 调用必须支持 mock。
- 频繁提交；每个任务结束时提交。

---

## 文件结构

```
openrepo-mentor/
├── README.md
├── package.json
├── tsconfig.json
├── bin/
│   └── orm.js
├── src/
│   ├── index.ts
│   ├── shared/
│   │   └── errors.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── loader.ts
│   ├── output/
│   │   ├── writer.ts
│   │   └── formatter.ts
│   ├── cli/
│   │   ├── program.ts
│   │   └── commands/
│   │       ├── scan.ts
│   │       ├── issue.ts
│   │       ├── plan.ts
│   │       └── report.ts
│   ├── core/
│   │   ├── scanner.ts
│   │   ├── analyzer.ts
│   │   ├── planner.ts
│   │   └── reporter.ts
│   └── llm/
│       ├── client.ts
│       └── prompts/
│           ├── scan.ts
│           ├── issue.ts
│           ├── plan.ts
│           └── report.ts
├── scripts/
│   └── build-site.ts
├── site-template/
│   └── index.html
├── test/
│   ├── fixtures/
│   │   ├── sample-project/
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   └── test/
│   │   │       └── index.test.ts
│   │   └── sample-issue.md
│   ├── scanner.test.ts
│   ├── analyzer.test.ts
│   ├── planner.test.ts
│   ├── reporter.test.ts
│   ├── config.test.ts
│   └── integration.test.ts
└── docs/
    ├── user-guide.md
    └── development.md
```

---

## 任务 1：项目脚手架

**负责人：** 姚权秩

**文件：**
- 创建：`openrepo-mentor/package.json`
- 创建：`openrepo-mentor/tsconfig.json`
- 创建：`openrepo-mentor/bin/orm.js`
- 创建：`openrepo-mentor/README.md`
- 创建：`openrepo-mentor/.gitignore`

**接口：**
- 产出：`orm` CLI 二进制入口，当前仅打印帮助并退出。

- [ ] **步骤 1：创建 `package.json`**

```json
{
  "name": "openrepo-mentor",
  "version": "0.1.0",
  "description": "A CLI mentor for student open-source practice",
  "type": "module",
  "bin": {
    "orm": "./bin/orm.js"
  },
  "scripts": {
    "dev": "tsx src/cli/program.ts",
    "build": "tsc -p tsconfig.json",
    "test": "node --test dist/test/*.test.js",
    "test:dev": "tsx --test test/*.test.ts",
    "build:site": "tsx scripts/build-site.ts"
  },
  "dependencies": {
    "chalk": "^5.6.2",
    "commander": "^14.0.2",
    "marked": "^15.0.0",
    "openai": "^4.90.0",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **步骤 2：创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **步骤 3：创建 `bin/orm.js`**

```js
#!/usr/bin/env node
import { program } from '../dist/cli/program.js';

program.parse();
```

- [ ] **步骤 4：创建 `src/cli/program.ts`**

```ts
import { Command } from 'commander';

const program = new Command('orm')
  .description('OpenRepo Mentor: a CLI for student open-source practice')
  .version('0.1.0');

program
  .command('scan <repo-path>')
  .description('Scan a local repository and generate an overview')
  .action(async (repoPath: string) => {
    console.log(`scan: ${repoPath}`);
  });

program
  .command('issue')
  .command('analyze <issue-file>')
  .description('Analyze a local issue file')
  .action(async (issueFile: string) => {
    console.log(`issue analyze: ${issueFile}`);
  });

program
  .command('plan')
  .description('Generate a contribution plan')
  .action(async () => {
    console.log('plan');
  });

program
  .command('report')
  .description('Generate the final practice report')
  .action(async () => {
    console.log('report');
  });

export { program };
```

- [ ] **步骤 5：创建 `.gitignore`**

```gitignore
node_modules/
dist/
.orm/
site/
*.log
.DS_Store
.env
.ormrc
```

- [ ] **步骤 6：创建快速开始版 `README.md`**

```markdown
# OpenRepo Mentor

A CLI tool to help students practice open-source contribution.

## Installation

```bash
cd openrepo-mentor
npm install
npm link
```

## Usage

```bash
orm scan ./target-repo
orm issue analyze ./issue.md
orm plan
orm report
```
```

- [ ] **步骤 7：安装依赖并验证 CLI 可运行**

运行：

```bash
cd /Users/gugu/code/my/openrepo-mentor
npm install
npm run build
node bin/orm.js --help
```

预期输出：帮助文本中列出 `scan`、`issue analyze`、`plan`、`report`。

- [ ] **步骤 8：提交**

```bash
git add openrepo-mentor/
git commit -m "feat(openrepo-mentor): scaffold CLI project"
```

---

## 任务 2：共享类型与错误处理

**负责人：** 姚权秩

**文件：**
- 创建：`src/shared/errors.ts`
- 创建：`src/types/index.ts`

**接口：**
- 产出：`OrmError`、`ErrorCodes`，以及 scan/issue/plan/report 的共享接口。

- [ ] **步骤 1：创建 `src/shared/errors.ts`**

```ts
export class OrmError extends Error {
  constructor(
    message: string,
    public readonly code: number
  ) {
    super(message);
    this.name = 'OrmError';
  }
}

export const ErrorCodes = {
  MISSING_API_KEY: 1,
  PATH_NOT_FOUND: 2,
  MISSING_PREREQUISITE: 3,
  LLM_CALL_FAILED: 4,
  OUTPUT_WRITE_FAILED: 5,
  INVALID_CONFIG: 6,
} as const;
```

- [ ] **步骤 2：创建 `src/types/index.ts`**

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

export interface IssueAnalysis {
  summary: string;
  type: 'bug' | 'feature' | 'refactor' | 'docs' | 'question';
  difficulty: 'easy' | 'medium' | 'hard';
  relatedFiles: string[];
  suggestedSteps: string[];
  risks: string[];
}

export interface ContributionPlan {
  goal: string;
  background: string;
  tasks: Array<{ title: string; description: string; files?: string[] }>;
  testPlan: string;
  prChecklist: string[];
}

export interface ReportInput {
  scanResult: ScanResult;
  issueResult: IssueAnalysis;
  planResult: ContributionPlan;
  members?: string[];
}
```

- [ ] **步骤 3：验证构建**

运行：

```bash
npm run build
```

预期：无 TypeScript 错误。

- [ ] **步骤 4：提交**

```bash
git add src/shared/errors.ts src/types/index.ts
git commit -m "feat(openrepo-mentor): add shared errors and types"
```

---

## 任务 3：配置加载器

**负责人：** 姚权秩

**文件：**
- 创建：`src/config/loader.ts`
- 创建：`test/config.test.ts`

**接口：**
- 产出：`loadConfig(options: { configPath?: string }): Promise<AppConfig>`。
- 产出：`AppConfig` 接口，包含 `provider`、`apiKey`、`model`、`baseURL`、`maxTokens`。

- [ ] **步骤 1：编写失败测试 `test/config.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config/loader.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('config loader', () => {
  it('loads api key from env var', async () => {
    process.env.ORM_ZHIPU_API_KEY = 'test-key';
    const config = await loadConfig({});
    assert.equal(config.apiKey, 'test-key');
    delete process.env.ORM_ZHIPU_API_KEY;
  });

  it('loads from .ormrc file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orm-'));
    const configPath = join(dir, '.ormrc');
    writeFileSync(configPath, JSON.stringify({ apiKey: 'rc-key', model: 'glm-4-air' }));
    const config = await loadConfig({ configPath });
    assert.equal(config.apiKey, 'rc-key');
    assert.equal(config.model, 'glm-4-air');
  });

  it('throws when api key is missing', async () => {
    delete process.env.ORM_ZHIPU_API_KEY;
    await assert.rejects(() => loadConfig({ configPath: '/nonexistent' }), /API key/);
  });
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：

```bash
npx tsx --test test/config.test.ts
```

预期：失败，提示 `Cannot find module` 或类似信息。

- [ ] **步骤 3：实现 `src/config/loader.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export interface AppConfig {
  provider: 'zhipu';
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
}

const DEFAULT_CONFIG: AppConfig = {
  provider: 'zhipu',
  apiKey: '',
  model: 'glm-4-flash',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  maxTokens: 4096,
};

export async function loadConfig(options: { configPath?: string } = {}): Promise<AppConfig> {
  const config: AppConfig = { ...DEFAULT_CONFIG };

  const configPath = options.configPath ?? resolve(process.cwd(), '.ormrc');
  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.assign(config, parsed);
  } catch (err) {
    if (options.configPath) {
      throw new OrmError(`Cannot read config file: ${configPath}`, ErrorCodes.INVALID_CONFIG);
    }
  }

  if (process.env.ORM_ZHIPU_API_KEY) {
    config.apiKey = process.env.ORM_ZHIPU_API_KEY;
  }
  if (process.env.ORM_MODEL) {
    config.model = process.env.ORM_MODEL;
  }
  if (process.env.ORM_MAX_TOKENS) {
    config.maxTokens = Number(process.env.ORM_MAX_TOKENS);
  }

  if (!config.apiKey) {
    throw new OrmError(
      'Missing Zhipu API key. Set ORM_ZHIPU_API_KEY or add apiKey to .ormrc.',
      ErrorCodes.MISSING_API_KEY
    );
  }

  return config;
}
```

- [ ] **步骤 4：运行测试确认通过**

运行：

```bash
npx tsx --test test/config.test.ts
```

预期：所有测试通过。

- [ ] **步骤 5：提交**

```bash
git add src/config/loader.ts test/config.test.ts
git commit -m "feat(openrepo-mentor): add config loader"
```

---

## 任务 4：输出写入器与格式化器

**负责人：** 姚权秩

**文件：**
- 创建：`src/output/writer.ts`
- 创建：`src/output/formatter.ts`

**接口：**
- 依赖：`ScanResult`、`IssueAnalysis`、`ContributionPlan`（来自 `src/types/index.ts`）。
- 产出：`writeScanReport`、`writeIssueAnalysis`、`writePlan`、`writeReport` 函数。

- [ ] **步骤 1：实现 `src/output/writer.ts`**

```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ScanResult, IssueAnalysis, ContributionPlan } from '../types/index.js';
import {
  formatScanReport,
  formatIssueAnalysis,
  formatPlan,
} from './formatter.js';

export const ORM_DIR = '.orm';

export async function ensureOrmDir(): Promise<string> {
  const dir = resolve(process.cwd(), ORM_DIR);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeScanReport(result: ScanResult): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'scan-report.json'), JSON.stringify(result, null, 2));
  await writeFile(resolve(dir, 'scan-report.md'), formatScanReport(result));
}

export async function writeIssueAnalysis(result: IssueAnalysis): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'issue-analysis.json'), JSON.stringify(result, null, 2));
  await writeFile(resolve(dir, 'issue-analysis.md'), formatIssueAnalysis(result));
}

export async function writePlan(plan: ContributionPlan): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'contribution-plan.md'), formatPlan(plan));
}

export async function writeReport(markdown: string): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'final-report.md'), markdown);
}
```

- [ ] **步骤 2：实现 `src/output/formatter.ts`**

```ts
import type { ScanResult, IssueAnalysis, ContributionPlan } from '../types/index.js';

export function formatScanReport(result: ScanResult): string {
  const lines = [
    '# 项目扫描报告',
    '',
    `- 项目路径：${result.repoPath}`,
    `- 包管理器：${result.packageManager}`,
    result.buildCommand ? `- 构建命令：${result.buildCommand}` : '',
    result.testCommand ? `- 测试命令：${result.testCommand}` : '',
    '',
    '## 主要语言',
    ...result.languages.map((l) => `- ${l.name}: ${l.percentage.toFixed(1)}%`),
    '',
    '## 技术栈',
    ...result.techStack.map((t) => `- ${t}`),
    '',
    '## 主要目录',
    ...result.topLevelDirectories.map((d) => `- ${d}`),
    '',
    '## 关键文件',
    `- README: ${result.keyFiles.readme ? '✅' : '❌'}`,
    `- LICENSE: ${result.keyFiles.license ? '✅' : '❌'}`,
    `- CONTRIBUTING: ${result.keyFiles.contributing ? '✅' : '❌'}`,
    `- CI 配置: ${result.keyFiles.ci ? '✅' : '❌'}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export function formatIssueAnalysis(result: IssueAnalysis): string {
  const lines = [
    '# Issue 分析报告',
    '',
    `## 摘要`,
    result.summary,
    '',
    `- 类型：${result.type}`,
    `- 难度：${result.difficulty}`,
    '',
    '## 可能相关文件',
    ...result.relatedFiles.map((f) => `- ${f}`),
    '',
    '## 建议解决步骤',
    ...result.suggestedSteps.map((s, i) => `${i + 1}. ${s}`),
    '',
    '## 风险点',
    ...result.risks.map((r) => `- ${r}`),
  ];
  return lines.join('\n');
}

export function formatPlan(plan: ContributionPlan): string {
  const lines = [
    '# 贡献计划',
    '',
    '## 目标',
    plan.goal,
    '',
    '## 背景',
    plan.background,
    '',
    '## 任务拆分',
    ...plan.tasks.map((t, i) => {
      const files = t.files ? `（涉及文件：${t.files.join(', ')}）` : '';
      return `${i + 1}. **${t.title}**${files}\n   ${t.description}`;
    }),
    '',
    '## 测试计划',
    plan.testPlan,
    '',
    '## PR 准备事项',
    ...plan.prChecklist.map((c) => `- [ ] ${c}`),
  ];
  return lines.join('\n');
}
```

- [ ] **步骤 3：验证构建**

运行：

```bash
npm run build
```

预期：无错误。

- [ ] **步骤 4：提交**

```bash
git add src/output/writer.ts src/output/formatter.ts
git commit -m "feat(openrepo-mentor): add output writer and formatter"
```

---

## 任务 5：智谱 LLM 客户端与 Mock 模式

**负责人：** 许琢章

**文件：**
- 创建：`src/llm/client.ts`
- 创建：`test/llm-client.test.ts`

**接口：**
- 依赖：`AppConfig`（来自 `src/config/loader.ts`）。
- 产出：`LLMClient`，包含 `complete(prompt): Promise<string>`。

- [ ] **步骤 1：编写失败测试 `test/llm-client.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLLMClient } from '../src/llm/client.js';
import type { AppConfig } from '../src/config/loader.js';

const baseConfig: AppConfig = {
  provider: 'zhipu',
  apiKey: 'fake',
  model: 'glm-4-flash',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  maxTokens: 1024,
};

describe('llm client', () => {
  it('mock mode returns predefined response', async () => {
    const client = createLLMClient(baseConfig, { mock: true });
    const response = await client.complete({
      system: 'sys',
      user: 'user',
    });
    assert.equal(response, 'mock response');
  });
});
```

- [ ] **步骤 2：运行测试确认失败**

```bash
npx tsx --test test/llm-client.test.ts
```

预期：失败。

- [ ] **步骤 3：实现 `src/llm/client.ts`**

```ts
import OpenAI from 'openai';
import { OrmError, ErrorCodes } from '../shared/errors.js';
import type { AppConfig } from '../config/loader.js';

export interface LLMPrompt {
  system: string;
  user: string;
}

export interface LLMClient {
  complete(prompt: LLMPrompt): Promise<string>;
}

export function createLLMClient(config: AppConfig, options: { mock?: boolean } = {}): LLMClient {
  if (options.mock) {
    return {
      async complete() {
        return 'mock response';
      },
    };
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    maxRetries: 3,
  });

  return {
    async complete(prompt: LLMPrompt): Promise<string> {
      try {
        const response = await client.chat.completions.create({
          model: config.model,
          max_tokens: config.maxTokens,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
        });

        const content = response.choices[0]?.message?.content ?? '';
        const usage = response.usage;
        if (usage) {
          console.error(`LLM usage: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}`);
        }
        return content;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new OrmError(`LLM call failed: ${message}`, ErrorCodes.LLM_CALL_FAILED);
      }
    },
  };
}
```

- [ ] **步骤 4：运行测试确认通过**

```bash
npx tsx --test test/llm-client.test.ts
```

预期：通过。

- [ ] **步骤 5：提交**

```bash
git add src/llm/client.ts test/llm-client.test.ts
git commit -m "feat(openrepo-mentor): add zhipu llm client with mock mode"
```

---

## 任务 6：仓库扫描器

**负责人：** 白一百

**文件：**
- 创建：`src/core/scanner.ts`
- 创建：`src/cli/commands/scan.ts`
- 修改：`src/cli/program.ts`
- 创建：`test/scanner.test.ts`
- 创建：`test/fixtures/sample-project/package.json`
- 创建：`test/fixtures/sample-project/tsconfig.json`
- 创建：`test/fixtures/sample-project/src/index.ts`
- 创建：`test/fixtures/sample-project/test/index.test.ts`

**接口：**
- 产出：`scanRepo(repoPath: string): Promise<ScanResult>`。
- 产出：`scanCommand(repoPath: string, options: GlobalOptions): Promise<void>`。

- [ ] **步骤 1：创建 fixture 文件**

`test/fixtures/sample-project/package.json`：

```json
{
  "name": "sample-project",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "test": "node --test dist/test/*.js"
  },
  "dependencies": {
    "commander": "^14.0.2"
  }
}
```

`test/fixtures/sample-project/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "outDir": "./dist"
  }
}
```

`test/fixtures/sample-project/src/index.ts`：

```ts
export function hello(): string {
  return 'hello';
}
```

`test/fixtures/sample-project/test/index.test.ts`：

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from '../src/index.js';

describe('hello', () => {
  it('returns hello', () => {
    assert.equal(hello(), 'hello');
  });
});
```

- [ ] **步骤 2：编写失败测试 `test/scanner.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanRepo } from '../src/core/scanner.js';
import { resolve } from 'node:path';

const fixturePath = resolve(process.cwd(), 'test/fixtures/sample-project');

describe('scanner', () => {
  it('detects TypeScript project and npm', async () => {
    const result = await scanRepo(fixturePath);
    assert.equal(result.packageManager, 'npm');
    assert.ok(result.languages.some((l) => l.name === 'TypeScript'));
    assert.equal(result.buildCommand, 'npm run build');
    assert.equal(result.testCommand, 'npm test');
    assert.ok(result.keyFiles.readme);
    assert.ok(result.keyFiles.license);
  });
});
```

- [ ] **步骤 3：实现 `src/core/scanner.ts`**

```ts
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import type { ScanResult } from '../types/index.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.orm', 'site']);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.js': 'JavaScript',
  '.tsx': 'TypeScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.md': 'Markdown',
};

export async function scanRepo(repoPath: string): Promise<ScanResult> {
  const absolutePath = resolve(repoPath);
  try {
    const s = await stat(absolutePath);
    if (!s.isDirectory()) {
      throw new OrmError(`Path is not a directory: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
    }
  } catch {
    throw new OrmError(`Path not found: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const topLevelDirectories: string[] = [];
  const extensions: Record<string, number> = {};
  let totalFiles = 0;

  for (const entry of entries) {
    if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
      topLevelDirectories.push(entry.name);
    }
    if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext) {
        extensions[ext] = (extensions[ext] ?? 0) + 1;
        totalFiles++;
      }
    }
  }

  const languages = Object.entries(extensions)
    .map(([ext, count]) => ({
      name: LANGUAGE_MAP[ext] ?? ext,
      percentage: totalFiles > 0 ? (count / totalFiles) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const packageManager = await detectPackageManager(absolutePath);
  const { buildCommand, testCommand } = await detectScripts(absolutePath, packageManager);
  const techStack = await detectTechStack(absolutePath);
  const keyFiles = await detectKeyFiles(absolutePath);

  return {
    repoPath: absolutePath,
    languages,
    techStack,
    packageManager,
    buildCommand,
    testCommand,
    topLevelDirectories,
    keyFiles,
  };
}

async function detectPackageManager(repoPath: string): Promise<string> {
  const files = await readdir(repoPath);
  if (files.includes('pnpm-lock.yaml')) return 'pnpm';
  if (files.includes('yarn.lock')) return 'yarn';
  if (files.includes('package-lock.json') || files.includes('package.json')) return 'npm';
  if (files.includes('poetry.lock') || files.includes('pyproject.toml')) return 'poetry';
  if (files.includes('requirements.txt')) return 'pip';
  return 'unknown';
}

async function detectScripts(
  repoPath: string,
  packageManager: string
): Promise<{ buildCommand?: string; testCommand?: string }> {
  if (!['npm', 'yarn', 'pnpm'].includes(packageManager)) {
    return {};
  }
  try {
    const raw = await readFile(resolve(repoPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const scripts = pkg.scripts ?? {};
    const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;
    const buildCommand = findScript(scripts, ['build', 'compile', 'dist']);
    const testCommand = findScript(scripts, ['test', 'spec']);
    return {
      buildCommand: buildCommand ? `${runCmd} ${buildCommand}` : undefined,
      testCommand: testCommand ? `${runCmd} ${testCommand}` : undefined,
    };
  } catch {
    return {};
  }
}

function findScript(scripts: Record<string, string>, keywords: string[]): string | undefined {
  return Object.keys(scripts).find((name) => keywords.some((k) => name.toLowerCase().includes(k)));
}

async function detectTechStack(repoPath: string): Promise<string[]> {
  const stack: string[] = [];
  const files = await readdir(repoPath);

  const checks: Array<[string, string | string[], string]> = [
    ['package.json', 'Node.js', 'Node.js'],
    ['tsconfig.json', 'TypeScript', 'TypeScript'],
    ['pyproject.toml', 'Python', 'Python'],
    ['requirements.txt', 'Python', 'Python'],
    ['go.mod', 'Go', 'Go'],
    ['Cargo.toml', 'Rust', 'Rust'],
    ['pom.xml', 'Java', 'Java'],
    ['build.gradle', 'Java', 'Java'],
  ];

  for (const [filename, _indicator, label] of checks) {
    if (files.includes(filename)) stack.push(label);
  }

  try {
    const raw = await readFile(resolve(repoPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const deps = Object.keys(pkg.dependencies ?? {});
    if (deps.includes('commander')) stack.push('commander');
    if (deps.includes('chalk')) stack.push('chalk');
    if (deps.includes('react')) stack.push('React');
    if (deps.includes('vue')) stack.push('Vue');
    if (deps.includes('express')) stack.push('Express');
    if (deps.includes('fastify')) stack.push('Fastify');
  } catch {
    // ignore
  }

  return [...new Set(stack)];
}

async function detectKeyFiles(repoPath: string): Promise<ScanResult['keyFiles']> {
  const files = await readdir(repoPath);
  const hasCi = files.some((f) => f === '.github' || f.startsWith('.gitlab'));
  return {
    readme: files.some((f) => /^readme/i.test(f)),
    license: files.some((f) => /^license/i.test(f)),
    contributing: files.some((f) => /^contributing/i.test(f)),
    ci: hasCi,
  };
}
```

- [ ] **步骤 4：添加 `src/cli/commands/scan.ts`**

```ts
import { scanRepo } from '../../core/scanner.js';
import { writeScanReport } from '../../output/writer.js';
import { loadConfig } from '../../config/loader.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';

export interface GlobalOptions {
  config?: string;
  verbose?: boolean;
  mockLlm?: boolean;
}

export async function scanCommand(repoPath: string, options: GlobalOptions): Promise<void> {
  const config = await loadConfig({ configPath: options.config });
  if (options.verbose) {
    console.error(`Using model: ${config.model}`);
  }

  const result = await scanRepo(repoPath);
  await writeScanReport(result);
  console.log(`Scan report written to .orm/scan-report.md`);
}
```

- [ ] **步骤 5：将 `scan` 命令接入 `src/cli/program.ts`**

将占位 `scan` action 替换为：

```ts
import { scanCommand } from './commands/scan.js';

program
  .command('scan <repo-path>')
  .description('Scan a local repository and generate an overview')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .action(async (repoPath: string, options: { config?: string; verbose?: boolean }) => {
    await scanCommand(repoPath, options);
  });
```

- [ ] **步骤 6：运行扫描器测试**

运行：

```bash
npx tsx --test test/scanner.test.ts
```

预期：通过。

- [ ] **步骤 7：手动运行 CLI scan**

运行：

```bash
npx tsx src/cli/program.ts scan test/fixtures/sample-project --verbose
```

预期：创建 `.orm/scan-report.md` 和 `.orm/scan-report.json`。

- [ ] **步骤 8：提交**

```bash
git add src/core/scanner.ts src/cli/commands/scan.ts src/cli/program.ts test/scanner.test.ts test/fixtures/sample-project/
git commit -m "feat(openrepo-mentor): implement orm scan command"
```

---

## 任务 7：Issue 分析器

**负责人：** 王冬岩

**文件：**
- 创建：`src/core/analyzer.ts`
- 创建：`src/llm/prompts/issue.ts`
- 创建：`src/cli/commands/issue.ts`
- 修改：`src/cli/program.ts`
- 创建：`test/analyzer.test.ts`
- 创建：`test/fixtures/sample-issue.md`

**接口：**
- 产出：`analyzeIssue(issueContent, scanResult?, options): Promise<IssueAnalysis>`。
- 产出：`renderIssuePrompt(issueContent, scanResult): LLMPrompt`。

- [ ] **步骤 1：创建 `test/fixtures/sample-issue.md`**

```markdown
# Bug: CLI crashes on Windows paths

The `pathMention` tool crashes when users mention paths with backslashes on Windows.
We should normalize the path separator before matching.
```

- [ ] **步骤 2：编写失败测试 `test/analyzer.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIssue } from '../src/core/analyzer.js';
import type { ScanResult } from '../src/types/index.js';

const scanResult: ScanResult = {
  repoPath: '/fake',
  languages: [{ name: 'TypeScript', percentage: 100 }],
  techStack: ['Node.js', 'TypeScript'],
  packageManager: 'npm',
  topLevelDirectories: ['src'],
  keyFiles: { readme: true, license: true, contributing: false, ci: true },
};

describe('analyzer', () => {
  it('returns structured analysis in mock mode', async () => {
    const issue = 'Fix Windows path handling in pathMention.';
    const result = await analyzeIssue(issue, scanResult, { mock: true });
    assert.equal(typeof result.summary, 'string');
    assert.ok(result.relatedFiles.length > 0);
  });
});
```

- [ ] **步骤 3：实现 `src/llm/prompts/issue.ts`**

```ts
import type { ScanResult } from '../../types/index.js';
import type { LLMPrompt } from '../client.js';

export function renderIssuePrompt(issueContent: string, scanResult?: ScanResult): LLMPrompt {
  const scanPart = scanResult
    ? `
项目路径：${scanResult.repoPath}
主要语言：${scanResult.languages.map((l) => l.name).join(', ')}
技术栈：${scanResult.techStack.join(', ')}
主要目录：${scanResult.topLevelDirectories.join(', ')}
`
    : '（未提供项目扫描结果）';

  return {
    system: `你是一名开源项目导师，擅长帮助学生理解 Issue 内容。请根据提供的 Issue 文本和项目扫描结果，输出一份结构化的 JSON 分析。输出必须是合法 JSON，不要包含任何解释性文字。`,
    user: `【项目扫描结果】\n${scanPart}\n\n【Issue 内容】\n${issueContent}\n\n请输出以下 JSON 格式：\n{\n  "summary": "一句话摘要",\n  "type": "bug | feature | refactor | docs | question",\n  "difficulty": "easy | medium | hard",\n  "relatedFiles": ["可能的文件路径"],\n  "suggestedSteps": ["步骤1", "步骤2"],\n  "risks": ["风险1"]\n}`,
  };
}
```

- [ ] **步骤 4：实现 `src/core/analyzer.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { IssueAnalysis, ScanResult } from '../types/index.js';
import { createLLMClient } from '../llm/client.js';
import { renderIssuePrompt } from '../llm/prompts/issue.js';
import { loadConfig } from '../config/loader.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export async function analyzeIssue(
  issueContent: string,
  scanResult?: ScanResult,
  options: { mock?: boolean; configPath?: string } = {}
): Promise<IssueAnalysis> {
  const config = await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config, { mock: options.mock });
  const prompt = renderIssuePrompt(issueContent, scanResult);
  const raw = await client.complete(prompt);

  return parseIssueAnalysis(raw);
}

export function parseIssueAnalysis(raw: string): IssueAnalysis {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const cleaned = jsonMatch ? jsonMatch[1] : raw;
  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: String(parsed.summary ?? ''),
      type: parsed.type ?? 'question',
      difficulty: parsed.difficulty ?? 'medium',
      relatedFiles: Array.isArray(parsed.relatedFiles) ? parsed.relatedFiles : [],
      suggestedSteps: Array.isArray(parsed.suggestedSteps) ? parsed.suggestedSteps : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    } as IssueAnalysis;
  } catch (err) {
    throw new OrmError(`Failed to parse LLM issue analysis: ${raw}`, ErrorCodes.LLM_CALL_FAILED);
  }
}
```

- [ ] **步骤 5：添加 `src/cli/commands/issue.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeIssue } from '../../core/analyzer.js';
import { writeIssueAnalysis } from '../../output/writer.js';
import { loadConfig } from '../../config/loader.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { GlobalOptions } from './scan.js';
import type { ScanResult } from '../../types/index.js';

export async function issueAnalyzeCommand(issueFile: string, options: GlobalOptions): Promise<void> {
  const absolutePath = resolve(issueFile);
  let issueContent: string;
  try {
    issueContent = await readFile(absolutePath, 'utf-8');
  } catch {
    throw new OrmError(`Issue file not found: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
  }

  let scanResult: ScanResult | undefined;
  try {
    const raw = await readFile(resolve(process.cwd(), '.orm/scan-report.json'), 'utf-8');
    scanResult = JSON.parse(raw);
  } catch {
    scanResult = undefined;
  }

  const result = await analyzeIssue(issueContent, scanResult, {
    mock: options.mockLlm,
    configPath: options.config,
  });
  await writeIssueAnalysis(result);
  console.log('Issue analysis written to .orm/issue-analysis.md');
}
```

- [ ] **步骤 6：将 `issue analyze` 命令接入 `src/cli/program.ts`**

将占位替换为：

```ts
import { issueAnalyzeCommand } from './commands/issue.js';

program
  .command('issue')
  .command('analyze <issue-file>')
  .description('Analyze a local issue file')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .action(async (issueFile: string, options: { config?: string; verbose?: boolean; mockLlm?: boolean }) => {
    await issueAnalyzeCommand(issueFile, options);
  });
```

- [ ] **步骤 7：运行分析器测试**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx --test test/analyzer.test.ts
```

预期：通过。

- [ ] **步骤 8：手动运行 CLI issue analyze**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts issue analyze test/fixtures/sample-issue.md --mock-llm
```

预期：创建 `.orm/issue-analysis.md` 和 `.orm/issue-analysis.json`。

- [ ] **步骤 9：提交**

```bash
git add src/core/analyzer.ts src/llm/prompts/issue.ts src/cli/commands/issue.ts src/cli/program.ts test/analyzer.test.ts test/fixtures/sample-issue.md
git commit -m "feat(openrepo-mentor): implement orm issue analyze command"
```

---

## 任务 8：贡献计划生成器

**负责人：** 许琢章

**文件：**
- 创建：`src/core/planner.ts`
- 创建：`src/llm/prompts/plan.ts`
- 创建：`src/cli/commands/plan.ts`
- 修改：`src/cli/program.ts`
- 创建：`test/planner.test.ts`

**接口：**
- 产出：`generatePlan(scanResult, issueResult, options): Promise<ContributionPlan>`。

- [ ] **步骤 1：编写失败测试 `test/planner.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../src/core/planner.js';
import type { ScanResult, IssueAnalysis } from '../src/types/index.js';

const scanResult: ScanResult = {
  repoPath: '/fake',
  languages: [{ name: 'TypeScript', percentage: 100 }],
  techStack: ['Node.js', 'TypeScript'],
  packageManager: 'npm',
  topLevelDirectories: ['src'],
  keyFiles: { readme: true, license: true, contributing: false, ci: true },
};

const issueResult: IssueAnalysis = {
  summary: 'Fix Windows path handling',
  type: 'bug',
  difficulty: 'medium',
  relatedFiles: ['src/pathMention.ts'],
  suggestedSteps: ['Find path separator usage', 'Use path.sep'],
  risks: ['POSIX compatibility'],
};

describe('planner', () => {
  it('generates a plan in mock mode', async () => {
    const plan = await generatePlan(scanResult, issueResult, { mock: true });
    assert.ok(plan.goal);
    assert.ok(plan.tasks.length > 0);
  });
});
```

- [ ] **步骤 2：实现 `src/llm/prompts/plan.ts`**

```ts
import type { ScanResult, IssueAnalysis } from '../../types/index.js';
import type { LLMPrompt } from '../client.js';

export function renderPlanPrompt(scanResult: ScanResult, issueResult: IssueAnalysis): LLMPrompt {
  return {
    system: `你是一名开源项目导师。请根据项目扫描结果和 Issue 分析结果，为学生生成一份清晰的贡献计划。输出必须是合法 JSON。`,
    user: `【项目扫描结果】\n${JSON.stringify(scanResult, null, 2)}\n\n【Issue 分析】\n${JSON.stringify(issueResult, null, 2)}\n\n请输出以下 JSON 格式：\n{\n  "goal": "贡献目标",\n  "background": "背景说明",\n  "tasks": [\n    { "title": "任务标题", "description": "任务描述", "files": ["可能修改的文件"] }\n  ],\n  "testPlan": "测试计划",\n  "prChecklist": ["PR 准备事项1", "PR 准备事项2"]\n}`,
  };
}
```

- [ ] **步骤 3：实现 `src/core/planner.ts`**

```ts
import type { ContributionPlan, IssueAnalysis, ScanResult } from '../types/index.js';
import { createLLMClient } from '../llm/client.js';
import { renderPlanPrompt } from '../llm/prompts/plan.js';
import { loadConfig } from '../config/loader.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export async function generatePlan(
  scanResult: ScanResult,
  issueResult: IssueAnalysis,
  options: { mock?: boolean; configPath?: string } = {}
): Promise<ContributionPlan> {
  const config = await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config, { mock: options.mock });
  const prompt = renderPlanPrompt(scanResult, issueResult);
  const raw = await client.complete(prompt);

  return parsePlan(raw);
}

export function parsePlan(raw: string): ContributionPlan {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const cleaned = jsonMatch ? jsonMatch[1] : raw;
  try {
    const parsed = JSON.parse(cleaned);
    return {
      goal: String(parsed.goal ?? ''),
      background: String(parsed.background ?? ''),
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map((t: any) => ({
            title: String(t.title ?? ''),
            description: String(t.description ?? ''),
            files: Array.isArray(t.files) ? t.files : undefined,
          }))
        : [],
      testPlan: String(parsed.testPlan ?? ''),
      prChecklist: Array.isArray(parsed.prChecklist) ? parsed.prChecklist : [],
    };
  } catch (err) {
    throw new OrmError(`Failed to parse LLM plan: ${raw}`, ErrorCodes.LLM_CALL_FAILED);
  }
}
```

- [ ] **步骤 4：添加 `src/cli/commands/plan.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generatePlan } from '../../core/planner.js';
import { writePlan } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { GlobalOptions } from './scan.js';
import type { ScanResult, IssueAnalysis } from '../../types/index.js';

async function readJson<T>(path: string): Promise<T> {
  try {
    const raw = await readFile(resolve(process.cwd(), path), 'utf-8');
    return JSON.parse(raw);
  } catch {
    throw new OrmError(`Missing prerequisite file: ${path}. Run the previous commands first.`, ErrorCodes.MISSING_PREREQUISITE);
  }
}

export async function planCommand(options: GlobalOptions): Promise<void> {
  const scanResult = await readJson<ScanResult>('.orm/scan-report.json');
  const issueResult = await readJson<IssueAnalysis>('.orm/issue-analysis.json');

  const plan = await generatePlan(scanResult, issueResult, {
    mock: options.mockLlm,
    configPath: options.config,
  });
  await writePlan(plan);
  console.log('Contribution plan written to .orm/contribution-plan.md');
}
```

- [ ] **步骤 5：接入 `plan` 命令**

在 `src/cli/program.ts` 中：

```ts
import { planCommand } from './commands/plan.js';

program
  .command('plan')
  .description('Generate a contribution plan')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .action(async (options: { config?: string; verbose?: boolean; mockLlm?: boolean }) => {
    await planCommand(options);
  });
```

- [ ] **步骤 6：运行计划器测试**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx --test test/planner.test.ts
```

预期：通过。

- [ ] **步骤 7：手动运行 CLI plan**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts plan --mock-llm
```

预期：创建 `.orm/contribution-plan.md`。

- [ ] **步骤 8：提交**

```bash
git add src/core/planner.ts src/llm/prompts/plan.ts src/cli/commands/plan.ts src/cli/program.ts test/planner.test.ts
git commit -m "feat(openrepo-mentor): implement orm plan command"
```

---

## 任务 9：报告生成器

**负责人：** 许琢章

**文件：**
- 创建：`src/core/reporter.ts`
- 创建：`src/llm/prompts/report.ts`
- 创建：`src/cli/commands/report.ts`
- 修改：`src/cli/program.ts`
- 创建：`test/reporter.test.ts`

**接口：**
- 产出：`generateReport(input, options): Promise<string>`。

- [ ] **步骤 1：编写失败测试 `test/reporter.test.ts`**

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/core/reporter.js';
import type { ReportInput } from '../src/types/index.js';

const input: ReportInput = {
  scanResult: {
    repoPath: '/fake',
    languages: [{ name: 'TypeScript', percentage: 100 }],
    techStack: ['Node.js'],
    packageManager: 'npm',
    topLevelDirectories: ['src'],
    keyFiles: { readme: true, license: true, contributing: false, ci: true },
  },
  issueResult: {
    summary: 'Fix Windows paths',
    type: 'bug',
    difficulty: 'medium',
    relatedFiles: ['src/pathMention.ts'],
    suggestedSteps: ['Find usage', 'Use path.sep'],
    risks: ['POSIX'],
  },
  planResult: {
    goal: 'Fix path separator',
    background: 'Project uses TypeScript.',
    tasks: [{ title: 'Fix', description: 'Use path.sep' }],
    testPlan: 'Run tests',
    prChecklist: ['Add tests'],
  },
};

describe('reporter', () => {
  it('generates final report in mock mode', async () => {
    const report = await generateReport(input, { mock: true });
    assert.ok(report.includes('项目选择'));
  });
});
```

- [ ] **步骤 2：实现 `src/llm/prompts/report.ts`**

```ts
import type { ReportInput } from '../../types/index.js';
import type { LLMPrompt } from '../client.js';

export function renderReportPrompt(input: ReportInput): LLMPrompt {
  return {
    system: `你是一名开源课程助教。请根据项目扫描、Issue 分析和贡献计划，为学生生成一份课程实践报告草稿。报告使用 Markdown 格式，包含以下章节。`,
    user: `【小组成员】\n${(input.members ?? ['待定']).join(', ')}\n\n【项目扫描结果】\n${JSON.stringify(input.scanResult, null, 2)}\n\n【Issue 分析】\n${JSON.stringify(input.issueResult, null, 2)}\n\n【贡献计划】\n${JSON.stringify(input.planResult, null, 2)}\n\n请生成 Markdown 报告，必须包含以下章节标题：\n# 开源课程实践报告\n## 1. 项目选择说明\n## 2. 项目结构分析\n## 3. Issue 分析\n## 4. 贡献计划\n## 5. 小组分工\n## 6. 实现过程记录（留空模板，供学生填写）\n## 7. 测试方式\n## 8. 总结（留空模板）\n## 9. 手动自检清单\n`,
  };
}
```

- [ ] **步骤 3：实现 `src/core/reporter.ts`**

```ts
import type { ReportInput } from '../types/index.js';
import { createLLMClient } from '../llm/client.js';
import { renderReportPrompt } from '../llm/prompts/report.js';
import { loadConfig } from '../config/loader.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export async function generateReport(
  input: ReportInput,
  options: { mock?: boolean; configPath?: string } = {}
): Promise<string> {
  const config = await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config, { mock: options.mock });
  const prompt = renderReportPrompt(input);
  return client.complete(prompt);
}
```

- [ ] **步骤 4：添加 `src/cli/commands/report.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateReport } from '../../core/reporter.js';
import { writeReport } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { GlobalOptions } from './scan.js';
import type { ScanResult, IssueAnalysis, ContributionPlan } from '../../types/index.js';

async function readJson<T>(path: string): Promise<T> {
  try {
    const raw = await readFile(resolve(process.cwd(), path), 'utf-8');
    return JSON.parse(raw);
  } catch {
    throw new OrmError(`Missing prerequisite file: ${path}`, ErrorCodes.MISSING_PREREQUISITE);
  }
}

export async function reportCommand(options: GlobalOptions & { site?: boolean; members?: string }): Promise<void> {
  const scanResult = await readJson<ScanResult>('.orm/scan-report.json');
  const issueResult = await readJson<IssueAnalysis>('.orm/issue-analysis.json');
  const planMarkdown = await readFile(resolve(process.cwd(), '.orm/contribution-plan.md'), 'utf-8');

  const planResult: ContributionPlan = {
    goal: scanResult.repoPath,
    background: planMarkdown,
    tasks: [],
    testPlan: '',
    prChecklist: [],
  };

  const members = options.members ? options.members.split(',').map((m) => m.trim()) : undefined;
  const report = await generateReport(
    { scanResult, issueResult, planResult, members },
    { mock: options.mockLlm, configPath: options.config }
  );
  await writeReport(report);
  console.log('Final report written to .orm/final-report.md');

  if (options.site) {
    const { buildSite } = await import('../../scripts/build-site.js');
    await buildSite();
    console.log('Static site built in site/');
  }
}
```

- [ ] **步骤 5：关于 plan.json 的说明**

目前 `plan` 只写入 `.md`。`report` 应读取 `.md` 并将完整文本传给报告 Prompt。后续可补充 `plan.json` schema，当前 Prompt 包含完整 plan markdown。

- [ ] **步骤 6：接入 `report` 命令**

在 `src/cli/program.ts` 中：

```ts
import { reportCommand } from './commands/report.js';

program
  .command('report')
  .description('Generate the final practice report')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .option('--site', 'Build static site after report')
  .option('--members <names>', 'Comma-separated team member names')
  .action(async (options: { config?: string; verbose?: boolean; mockLlm?: boolean; site?: boolean; members?: string }) => {
    await reportCommand(options);
  });
```

- [ ] **步骤 7：运行报告测试**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx --test test/reporter.test.ts
```

预期：通过。

- [ ] **步骤 8：手动运行 CLI report**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts report --mock-llm --members "姚权秩,徐泽铖,白一百,王冬岩,许琢章"
```

预期：创建 `.orm/final-report.md`。

- [ ] **步骤 9：提交**

```bash
git add src/core/reporter.ts src/llm/prompts/report.ts src/cli/commands/report.ts src/cli/program.ts test/reporter.test.ts
git commit -m "feat(openrepo-mentor): implement orm report command"
```

---

## 任务 10：静态网站生成器

**负责人：** 徐泽铖

**文件：**
- 创建：`site-template/index.html`
- 创建：`scripts/build-site.ts`
- 创建：`docs/user-guide.md`
- 创建：`docs/development.md`

**接口：**
- 产出：`buildSite(): Promise<void>`。

- [ ] **步骤 1：创建 `site-template/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRepo Mentor</title>
  <style>
    :root { --bg: #f9fafb; --text: #1f2937; --accent: #2563eb; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #111827; --text: #f3f4f6; --accent: #60a5fa; }
    }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; max-width: 860px; margin: 0 auto; padding: 2rem; }
    nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
    nav a { color: var(--accent); text-decoration: none; }
    h1, h2, h3 { color: var(--text); }
    pre { background: rgba(0,0,0,0.05); padding: 1rem; overflow-x: auto; border-radius: 6px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body>
  <nav>
    <a href="index.html">首页</a>
    <a href="guide.html">使用指南</a>
    <a href="report.html">实践报告</a>
  </nav>
  <article id="content"></article>
</body>
</html>
```

- [ ] **步骤 2：创建 `docs/user-guide.md`**

```markdown
# OpenRepo Mentor 用户指南

## 安装

```bash
cd openrepo-mentor
npm install
npm link
```

## 配置

创建 `.ormrc`：

```json
{
  "apiKey": "你的智谱 API Key"
}
```

或在命令行设置：

```bash
export ORM_ZHIPU_API_KEY="你的智谱 API Key"
```

## 使用流程

```bash
orm scan ./target-repo
orm issue analyze ./issue.md
orm plan
orm report --members "Alice,Bob"
```
```

- [ ] **步骤 3：创建 `docs/development.md`**

```markdown
# OpenRepo Mentor 开发文档

## 项目结构

见 PRD。

## 运行测试

```bash
npm run test:dev
```

## 使用 mock LLM

```bash
orm scan ./repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm
```
```

- [ ] **步骤 4：实现 `scripts/build-site.ts`**

```ts
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { marked } from 'marked';

interface Page {
  title: string;
  input: string;
  output: string;
}

const pages: Page[] = [
  { title: 'OpenRepo Mentor', input: 'README.md', output: 'index.html' },
  { title: '使用指南', input: 'docs/user-guide.md', output: 'guide.html' },
  { title: '实践报告', input: '.orm/final-report.md', output: 'report.html' },
];

export async function buildSite(): Promise<void> {
  const siteDir = resolve(process.cwd(), 'site');
  await mkdir(siteDir, { recursive: true });
  await copyFile(resolve(process.cwd(), 'site-template/index.html'), resolve(siteDir, 'index.html'));

  const template = await readFile(resolve(process.cwd(), 'site-template/index.html'), 'utf-8');

  for (const page of pages) {
    let markdown: string;
    try {
      markdown = await readFile(resolve(process.cwd(), page.input), 'utf-8');
    } catch {
      markdown = `# ${page.title}\n\n内容待生成。`;
    }
    const html = template
      .replace(`<title>OpenRepo Mentor</title>`, `<title>${page.title}</title>`)
      .replace('<article id="content"></article>', `<article id="content">\n${marked(markdown)}\n</article>`);
    await writeFile(resolve(siteDir, page.output), html);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildSite();
  console.log('Static site built in site/');
}
```

- [ ] **步骤 5：在 package.json scripts 中添加 build:site**

```json
"build:site": "tsx scripts/build-site.ts"
```

- [ ] **步骤 6：手动构建网站**

运行：

```bash
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts scan test/fixtures/sample-project --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts issue analyze test/fixtures/sample-issue.md --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts plan --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts report --mock-llm --site
```

然后检查 `site/index.html` 和 `site/report.html` 是否存在。

- [ ] **步骤 7：提交**

```bash
git add site-template/index.html scripts/build-site.ts docs/user-guide.md docs/development.md package.json
git commit -m "feat(openrepo-mentor): add static site generator and docs"
```

---

## 任务 11：集成测试

**负责人：** 许琢章

**文件：**
- 创建：`test/integration.test.ts`

- [ ] **步骤 1：编写集成测试**

```ts
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scanRepo } from '../src/core/scanner.js';
import { analyzeIssue } from '../src/core/analyzer.js';
import { generatePlan } from '../src/core/planner.js';
import { generateReport } from '../src/core/reporter.js';

describe('integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'orm-int-'));
    mkdirSync(join(tmpDir, 'src'));
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } })
    );
    writeFileSync(join(tmpDir, 'src', 'index.ts'), 'export const x = 1;');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs full pipeline in mock mode', async () => {
    const scan = await scanRepo(tmpDir);
    assert.equal(scan.packageManager, 'npm');

    const issue = 'Fix the demo bug in index.ts';
    const analysis = await analyzeIssue(issue, scan, { mock: true });
    assert.ok(analysis.summary);

    const plan = await generatePlan(scan, analysis, { mock: true });
    assert.ok(plan.goal);

    const report = await generateReport({ scanResult: scan, issueResult: analysis, planResult: plan }, { mock: true });
    assert.ok(report.includes('#'));
  });
});
```

- [ ] **步骤 2：运行集成测试**

```bash
ORM_ZHIPU_API_KEY=fake npx tsx --test test/integration.test.ts
```

预期：通过。

- [ ] **步骤 3：提交**

```bash
git add test/integration.test.ts
git commit -m "test(openrepo-mentor): add integration test"
```

---

## 任务 12：最终打磨与交付检查清单

**负责人：** 全员

- [ ] **步骤 1：运行完整测试套件**

```bash
ORM_ZHIPU_API_KEY=fake npm run test:dev
```

预期：所有测试通过。

- [ ] **步骤 2：运行类型检查**

```bash
npx tsc --noEmit
```

预期：无错误。

- [ ] **步骤 3：运行构建**

```bash
npm run build
npm run test
```

预期：构建成功，且基于 `dist/` 的测试通过。

- [ ] **步骤 4：端到端手动运行**

```bash
cd /Users/gugu/code/my/openrepo-mentor
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts scan test/fixtures/sample-project --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts issue analyze test/fixtures/sample-issue.md --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts plan --mock-llm
ORM_ZHIPU_API_KEY=fake npx tsx src/cli/program.ts report --mock-llm --site --members "姚权秩,徐泽铖,白一百,王冬岩,许琢章"
```

预期：
- 创建 `.orm/scan-report.md`
- 创建 `.orm/issue-analysis.md`
- 创建 `.orm/contribution-plan.md`
- 创建 `.orm/final-report.md`
- 创建 `site/index.html`、`site/guide.html`、`site/report.html`

- [ ] **步骤 5：用真实用法更新 README**

添加章节：安装、配置、命令、开发。

- [ ] **步骤 6：最终提交**

```bash
git add README.md
git commit -m "docs(openrepo-mentor): finalize README"
```

---

## 自检

### 规格覆盖

| 规格需求 | 实现任务 |
|---|---|
| 4 个 CLI 命令 | 任务 6、7、8、9 |
| 智谱 LLM 集成 | 任务 5 |
| 配置加载 | 任务 3 |
| 输出到 `.orm/` | 任务 4、6、7、8、9 |
| 静态网站 | 任务 10 |
| 测试 | 任务 3、6、7、8、9、11、12 |
| Mock LLM 模式 | 任务 5、6、7、8、9、11 |
| 错误处理 / 退出码 | 任务 2、3、6、7、8、9 |
| 5 人团队分配 | 每个任务都有负责人 |

### 占位符检查

- 步骤中无 TBD/TODO。
- 每个代码步骤包含实际代码。
- 每个测试步骤包含实际测试代码。
- 验证命令包含预期输出。

### 类型一致性

- `GlobalOptions` 定义于 `src/cli/commands/scan.ts`，被 issue/plan/report 使用。
- `AppConfig` 仅在 `src/config/loader.ts` 中定义。
- `LLMPrompt` 仅在 `src/llm/client.ts` 中定义。
- 所有类型从 `src/types/index.ts` 导入。

未发现不一致。

---

## 执行交接

**计划已完成并保存至 `docs/implementation-plan.md`。**

两种执行方式：

**1. 子代理驱动（推荐）** — 每个任务派一个子代理执行，任务之间由我审核，迭代快。

**2. 内联执行** — 在当前会话使用 `superpowers:executing-plans` 批量执行任务，带有检查点。

选择哪种方式？
