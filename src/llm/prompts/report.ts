import type { ReportInput } from '../../types/index.js';
import type { LLMPrompt } from '../client.js';

export function renderReportPrompt(input: ReportInput): LLMPrompt {
  return {
    system: `你是一名开源课程助教。请根据项目扫描、Issue 分析和贡献计划，为学生生成一份课程实践报告草稿。报告使用 Markdown 格式，包含以下章节。`,
    user: `【小组成员】\n${(input.members ?? ['待定']).join(', ')}\n\n【项目扫描结果】\n${JSON.stringify(input.scanResult, null, 2)}\n\n【Issue 分析】\n${JSON.stringify(input.issueResult, null, 2)}\n\n【贡献计划】\n${JSON.stringify(input.planResult, null, 2)}\n\n请生成 Markdown 报告，必须包含以下章节标题：\n# 开源课程实践报告\n## 1. 项目选择说明\n## 2. 项目结构分析\n## 3. Issue 分析\n## 4. 贡献计划\n## 5. 小组分工\n## 6. 实现过程记录（留空模板，供学生填写）\n## 7. 测试方式\n## 8. 总结（留空模板）\n## 9. 手动自检清单\n`,
  };
}
