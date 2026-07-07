import type { ScanResult } from '../../types/index.js';

export interface IssuePrompt {
  system: string;
  user: string;
}

export function renderIssuePrompt(issueContent: string, scanResult?: ScanResult): IssuePrompt {
  return {
    system:
      '你是一名开源项目导师。请分析学生提供的 Issue，并输出结构化的 Issue 分析结果。',
    user: [
      '【Issue 内容】',
      issueContent,
      '',
      '【项目扫描结果】',
      scanResult ? JSON.stringify(scanResult, null, 2) : '暂无 scan-report.json',
      '',
      '请输出 JSON，字段包括 summary、type、difficulty、relatedFiles、suggestedSteps、risks。',
    ].join('\n'),
  };
}
