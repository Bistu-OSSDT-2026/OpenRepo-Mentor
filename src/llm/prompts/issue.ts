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
