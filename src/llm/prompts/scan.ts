import type { ScanResult } from '../../types/index.js';

export interface ScanPrompt {
  system: string;
  user: string;
}

/**
 * Render an LLM prompt for enhancing a scan report with additional insights.
 *
 * This is a placeholder for future LLM-based scan enhancement.
 * The current `orm scan` command is purely local file-I/O and does not call this.
 */
export function renderScanPrompt(scanResult: ScanResult): ScanPrompt {
  return {
    system:
      '你是一名开源项目导师。请分析项目扫描结果，并补充项目的功能概述、架构建议和学习路线。',
    user: [
      '【项目扫描结果】',
      JSON.stringify(scanResult, null, 2),
      '',
      '请基于以上扫描结果，用中文输出 JSON，字段包括 overview（项目功能概述）、architecture（架构建议）、learningPath（学习路线）。',
    ].join('\n'),
  };
}
