import type { ScanResult } from '../../types/index.js';

export interface IssuePrompt {
  system: string;
  user: string;
}

export function renderIssuePrompt(issueContent: string, scanResult?: ScanResult): IssuePrompt {
  return {
    system: `你是一名开源项目导师。请分析学生提供的 Issue，并输出结构化的 Issue 分析结果。

## 输出格式要求

必须输出合法 JSON，不要包含任何解释性文字，不要包含 Markdown 代码块标记。

JSON 字段如下：
- summary: string，一句话概括 Issue
- type: string，必须是以下小写值之一："bug" | "feature" | "refactor" | "docs" | "question"
- difficulty: string，必须是以下小写值之一："easy" | "medium" | "hard"
- relatedFiles: string[]，可能的文件路径数组，每个元素是字符串，不要添加注释
- suggestedSteps: string[]，建议解决步骤数组，每个元素是字符串描述，不要对象
- risks: string[]，风险点数组，每个元素是字符串描述，不要对象

## 示例输出

{
  "summary": "修复 Windows 路径分隔符问题",
  "type": "bug",
  "difficulty": "medium",
  "relatedFiles": ["src/path.ts"],
  "suggestedSteps": [
    "定位硬编码路径分隔符的位置",
    "将 '/' 替换为 path.sep",
    "添加 Windows 路径单元测试"
  ],
  "risks": [
    "可能影响 POSIX 系统路径解析",
    "需要额外测试 WSL 环境"
  ]
}`,
    user: [
      '【Issue 内容】',
      issueContent,
      '',
      '【项目扫描结果】',
      scanResult ? JSON.stringify(scanResult, null, 2) : '暂无 scan-report.json',
      '',
      '请严格按照上述格式输出 JSON。',
    ].join('\n'),
  };
}
