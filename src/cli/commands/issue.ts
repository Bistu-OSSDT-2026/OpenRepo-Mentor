import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeIssue } from '../../core/analyzer.js';
import { writeIssueAnalysis } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { ScanResult } from '../../types/index.js';

export interface IssueAnalyzeOptions {
  config?: string;
  verbose?: boolean;
  mockLlm?: boolean;
}

export async function issueAnalyzeCommand(
  issueFile: string,
  options: IssueAnalyzeOptions
): Promise<void> {
  const absolutePath = resolve(issueFile);

  let issueContent: string;
  try {
    issueContent = await readFile(absolutePath, 'utf-8');
  } catch {
    throw new OrmError(`Issue file not found: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
  }

  const scanResult = await readOptionalScanReport();

  if (options.verbose) {
    console.error(`Analyzing issue file: ${absolutePath}`);
    console.error(scanResult ? 'Using .orm/scan-report.json' : 'No .orm/scan-report.json found');
  }

  const result = await analyzeIssue(issueContent, scanResult, {
    mock: options.mockLlm,
    configPath: options.config,
  });

  await writeIssueAnalysis(result);
  console.log('Issue analysis written to .orm/issue-analysis.md');
}

async function readOptionalScanReport(): Promise<ScanResult | undefined> {
  try {
    const raw = await readFile(resolve(process.cwd(), '.orm/scan-report.json'), 'utf-8');
    return JSON.parse(raw) as ScanResult;
  } catch {
    return undefined;
  }
}
