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
