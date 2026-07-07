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
