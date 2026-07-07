import { loadConfig } from '../config/loader.js';
import { createLLMClient } from '../llm/client.js';
import { renderPlanPrompt } from '../llm/prompts/plan.js';
import { ErrorCodes, OrmError } from '../shared/errors.js';
import type { ContributionPlan, IssueAnalysis, ScanResult } from '../types/index.js';

export async function generatePlan(
  scanResult: ScanResult,
  issueResult: IssueAnalysis,
  options: { mock?: boolean; configPath?: string } = {}
): Promise<ContributionPlan> {
  const config = options.mock ? mockConfig() : await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config, { mock: options.mock });
  const prompt = renderPlanPrompt(scanResult, issueResult);
  const raw = await client.complete(prompt);

  return parsePlan(raw);
}

export function parsePlan(raw: string): ContributionPlan {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const cleaned = jsonMatch ? jsonMatch[1] : raw;

  try {
    const parsed: unknown = JSON.parse(cleaned);
    return normalizePlan(parsed);
  } catch {
    throw new OrmError(`Failed to parse LLM plan: ${raw}`, ErrorCodes.LLM_CALL_FAILED);
  }
}

function normalizePlan(parsed: unknown): ContributionPlan {
  const value = isRecord(parsed) ? parsed : {};
  return {
    goal: String(value.goal ?? ''),
    background: String(value.background ?? ''),
    tasks: Array.isArray(value.tasks)
      ? value.tasks.map((task) => {
          const taskValue = isRecord(task) ? task : {};
          return {
            title: String(taskValue.title ?? ''),
            description: String(taskValue.description ?? ''),
            files: Array.isArray(taskValue.files) ? taskValue.files.map(String) : undefined,
          };
        })
      : [],
    testPlan: String(value.testPlan ?? ''),
    prChecklist: Array.isArray(value.prChecklist) ? value.prChecklist.map(String) : [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mockConfig() {
  return {
    provider: 'zhipu' as const,
    apiKey: 'mock',
    model: 'glm-4-flash',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    maxTokens: 4096,
  };
}
