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
      async complete(prompt: LLMPrompt) {
        if (prompt.system === 'sys' && prompt.user === 'user') {
          return 'mock response';
        }
        if (prompt.user.includes('"summary": "一句话摘要"')) {
          return JSON.stringify({
            summary: 'Fix Windows path handling',
            type: 'bug',
            difficulty: 'medium',
            relatedFiles: ['src/pathMention.ts'],
            suggestedSteps: ['Find path separator usage', 'Use path.sep'],
            risks: ['POSIX compatibility'],
          });
        }
        if (prompt.user.includes('"goal": "贡献目标"')) {
          return JSON.stringify({
            goal: 'Fix path separator handling',
            background: 'Project uses TypeScript and needs cross-platform path handling.',
            tasks: [
              {
                title: 'Update path handling',
                description: 'Normalize Windows and POSIX path separators before matching.',
                files: ['src/pathMention.ts'],
              },
            ],
            testPlan: 'Run related unit tests and integration tests.',
            prChecklist: ['Add tests', 'Run test suite'],
          });
        }
        if (prompt.user.includes('# 开源课程实践报告')) {
          return [
            '# 开源课程实践报告',
            '',
            '## 1. 项目选择说明',
            '项目选择说明。',
            '',
            '## 2. 项目结构分析',
            '项目结构分析。',
            '',
            '## 3. Issue 分析',
            'Issue 分析。',
            '',
            '## 4. 贡献计划',
            '贡献计划。',
            '',
            '## 5. 小组分工',
            '小组分工。',
            '',
            '## 6. 实现过程记录（留空模板，供学生填写）',
            '',
            '## 7. 测试方式',
            '测试方式。',
            '',
            '## 8. 总结（留空模板）',
            '',
            '## 9. 手动自检清单',
            '- [ ] 已运行测试',
          ].join('\n');
        }
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
