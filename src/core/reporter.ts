import { loadConfig } from '../config/loader.js';
import { createLLMClient } from '../llm/client.js';
import { renderReportPrompt } from '../llm/prompts/report.js';
import type { ReportInput } from '../types/index.js';

export async function generateReport(
  input: ReportInput,
  options: { mock?: boolean; configPath?: string } = {}
): Promise<string> {
  const config = options.mock ? mockConfig() : await loadConfig({ configPath: options.configPath });
  const client = createLLMClient(config, { mock: options.mock });
  const prompt = renderReportPrompt(input);
  return client.complete(prompt);
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
