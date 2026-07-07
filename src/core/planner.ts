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
  const config = options.mock
    ? {
        provider: 'zhipu' as const,
        apiKey: 'mock',
        model: 'glm-4-flash',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
        maxTokens: 4096,
      }
    : await loadConfig({ configPath: options.configPath });
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
