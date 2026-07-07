import type { IssueAnalysis, ScanResult } from '../../types/index.js';
import type { LLMPrompt } from '../client.js';

export function renderPlanPrompt(scanResult: ScanResult, issueResult: IssueAnalysis): LLMPrompt {
  return {
    system: '你是一名开源项目导师。请根据项目扫描结果和 Issue 分析结果，为学生生成一份清晰的贡献计划。输出必须是合法 JSON。',
    user: `【项目扫描结果】\n${JSON.stringify(scanResult, null, 2)}\n\n【Issue 分析】\n${JSON.stringify(issueResult, null, 2)}\n\n请输出以下 JSON 格式：\n{\n  "goal": "贡献目标",\n  "background": "背景说明",\n  "tasks": [\n    { "title": "任务标题", "description": "任务描述", "files": ["可能修改的文件"] }\n  ],\n  "testPlan": "测试计划",\n  "prChecklist": ["PR 准备事项1", "PR 准备事项2"]\n}`,
  };
}
