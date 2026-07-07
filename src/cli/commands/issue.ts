import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeIssue } from '../../core/analyzer.js';
import { writeIssueAnalysis } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { GlobalOptions } from './scan.js';
import type { ScanResult } from '../../types/index.js';

export async function issueAnalyzeCommand(issueFile: string, options: GlobalOptions): Promise<void> {
  const absolutePath = resolve(issueFile);
  let issueContent: string;
  try {
    issueContent = await readFile(absolutePath, 'utf-8');
  } catch {
    throw new OrmError(`Issue file not found: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
  }

  let scanResult: ScanResult | undefined;
  try {
    const raw = await readFile(resolve(process.cwd(), '.orm/scan-report.json'), 'utf-8');
    scanResult = JSON.parse(raw);
  } catch {
    scanResult = undefined;
  }

  const result = await analyzeIssue(issueContent, scanResult, {
    mock: options.mockLlm,
    configPath: options.config,
  });
  await writeIssueAnalysis(result);
  console.log('Issue analysis written to .orm/issue-analysis.md');
}
