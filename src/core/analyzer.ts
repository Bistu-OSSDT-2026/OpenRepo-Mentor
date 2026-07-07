import type { IssueAnalysis, ScanResult } from '../types/index.js';
import { renderIssuePrompt } from '../llm/prompts/issue.js';
import { createLLMClient } from '../llm/client.js';
import { loadConfig } from '../config/loader.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export interface AnalyzeIssueOptions {
  mock?: boolean;
  configPath?: string;
}

export async function analyzeIssue(
  issueContent: string,
  scanResult?: ScanResult,
  options: AnalyzeIssueOptions = {}
): Promise<IssueAnalysis> {
  const prompt = renderIssuePrompt(issueContent, scanResult);

  if (options.mock) {
    return mockAnalyzeIssue(issueContent, scanResult, prompt.user);
  }

  const config = await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config);
  const raw = await client.complete(prompt);
  return parseIssueAnalysis(raw);
}

export function parseIssueAnalysis(raw: string): IssueAnalysis {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const cleaned = jsonMatch ? jsonMatch[1] : raw;

  try {
    const parsed = JSON.parse(cleaned);
    return normalizeIssueAnalysis(parsed);
  } catch {
    throw new OrmError(`Failed to parse issue analysis: ${raw}`, ErrorCodes.LLM_CALL_FAILED);
  }
}

function mockAnalyzeIssue(
  issueContent: string,
  scanResult?: ScanResult,
  promptText?: string
): IssueAnalysis {
  const summary = buildSummary(issueContent);
  const type = detectIssueType(issueContent);
  const difficulty = detectDifficulty(issueContent);
  const relatedFiles = detectRelatedFiles(issueContent, scanResult);
  const suggestedSteps = buildSuggestedSteps(type, relatedFiles);
  const risks = buildRisks(type, difficulty);

  return {
    summary,
    type,
    difficulty,
    relatedFiles,
    suggestedSteps,
    risks,
  };
}

function normalizeIssueAnalysis(parsed: any): IssueAnalysis {
  return {
    summary: String(parsed.summary ?? ''),
    type: isIssueType(parsed.type) ? parsed.type : 'question',
    difficulty: isDifficulty(parsed.difficulty) ? parsed.difficulty : 'medium',
    relatedFiles: Array.isArray(parsed.relatedFiles) ? parsed.relatedFiles.map(String) : [],
    suggestedSteps: Array.isArray(parsed.suggestedSteps) ? parsed.suggestedSteps.map(String) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
  };
}

function buildSummary(issueContent: string): string {
  const firstMeaningfulLine =
    issueContent
      .split(/\r?\n/)
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .find(Boolean) ?? 'Local issue';

  return `Analyze issue: ${firstMeaningfulLine}`;
}

function detectIssueType(issueContent: string): IssueAnalysis['type'] {
  const text = issueContent.toLowerCase();

  if (/(bug|error|fail|crash|exception|错误|失败|异常|修复)/.test(text)) {
    return 'bug';
  }
  if (/(feature|enhance|add|support|新增|功能|支持)/.test(text)) {
    return 'feature';
  }
  if (/(refactor|cleanup|重构|优化结构)/.test(text)) {
    return 'refactor';
  }
  if (/(doc|readme|文档|说明)/.test(text)) {
    return 'docs';
  }
  return 'question';
}

function detectDifficulty(issueContent: string): IssueAnalysis['difficulty'] {
  const text = issueContent.toLowerCase();

  if (/(architecture|database|security|breaking|complex|架构|数据库|安全|复杂)/.test(text)) {
    return 'hard';
  }
  if (/(typo|readme|doc|文档|拼写|简单)/.test(text)) {
    return 'easy';
  }
  return 'medium';
}

function detectRelatedFiles(issueContent: string, scanResult?: ScanResult): string[] {
  const fileMatches = issueContent.match(/[\w./-]+\.(ts|tsx|js|jsx|json|md|yml|yaml)/g);
  if (fileMatches && fileMatches.length > 0) {
    return Array.from(new Set(fileMatches));
  }

  if (scanResult?.topLevelDirectories?.includes('src')) {
    return ['src/'];
  }

  if (scanResult?.keyFiles?.readme) {
    return ['README.md'];
  }

  return [];
}

function buildSuggestedSteps(
  type: IssueAnalysis['type'],
  relatedFiles: string[]
): string[] {
  const filesText = relatedFiles.length > 0 ? relatedFiles.join(', ') : 'the related source files';

  const commonSteps = [
    `Read the issue carefully and confirm the expected behavior.`,
    `Check ${filesText} to locate the possible implementation area.`,
    `Make the smallest reasonable change and keep existing behavior stable.`,
    `Run the related tests or add a small test case for the change.`,
  ];

  if (type === 'docs') {
    return [
      'Confirm which documentation section should be updated.',
      `Update ${filesText}.`,
      'Review the wording and examples for clarity.',
    ];
  }

  if (type === 'bug') {
    return [
      ...commonSteps,
      'Reproduce the bug before fixing it if possible.',
      'Verify that the bug no longer appears after the change.',
    ];
  }

  return commonSteps;
}

function buildRisks(
  type: IssueAnalysis['type'],
  difficulty: IssueAnalysis['difficulty']
): string[] {
  const risks = ['The issue description may be incomplete or ambiguous.'];

  if (type === 'bug') {
    risks.push('A fix may affect existing behavior if the root cause is misunderstood.');
  }

  if (difficulty === 'hard') {
    risks.push('The change may touch multiple modules and require extra testing.');
  }

  return risks;
}

function isIssueType(value: unknown): value is IssueAnalysis['type'] {
  return value === 'bug' || value === 'feature' || value === 'refactor' || value === 'docs' || value === 'question';
}

function isDifficulty(value: unknown): value is IssueAnalysis['difficulty'] {
  return value === 'easy' || value === 'medium' || value === 'hard';
}
