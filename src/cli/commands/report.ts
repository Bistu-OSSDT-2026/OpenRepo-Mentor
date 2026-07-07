import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateReport } from '../../core/reporter.js';
import { writeReport } from '../../output/writer.js';
import { ErrorCodes, OrmError } from '../../shared/errors.js';
import type { ContributionPlan, IssueAnalysis, ScanResult } from '../../types/index.js';

export interface ReportOptions {
  config?: string;
  verbose?: boolean;
  mockLlm?: boolean;
  site?: boolean;
  members?: string;
}

export async function reportCommand(options: ReportOptions): Promise<void> {
  let scanResult: ScanResult;
  let issueResult: IssueAnalysis;
  let planMarkdown: string;

  try {
    scanResult = await readJson<ScanResult>('.orm/scan-report.json');
    issueResult = await readJson<IssueAnalysis>('.orm/issue-analysis.json');
    planMarkdown = await readFile(resolve(process.cwd(), '.orm/contribution-plan.md'), 'utf-8');
  } catch (err) {
    if (options.site) {
      await buildStaticSite();
      return;
    }
    throw err;
  }

  if (options.verbose) {
    console.error('Generating final report from .orm intermediate files');
  }

  const planResult: ContributionPlan = {
    goal: scanResult.repoPath,
    background: planMarkdown,
    tasks: [],
    testPlan: '',
    prChecklist: [],
  };
  const members = options.members ? options.members.split(',').map((member) => member.trim()) : undefined;
  const report = await generateReport(
    { scanResult, issueResult, planResult, members },
    { mock: options.mockLlm, configPath: options.config }
  );

  await writeReport(report);
  console.log('Final report written to .orm/final-report.md');

  if (options.site) {
    await buildStaticSite();
  }
}

async function readJson<T>(path: string): Promise<T> {
  try {
    const raw = await readFile(resolve(process.cwd(), path), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    throw new OrmError(`Missing prerequisite file: ${path}`, ErrorCodes.MISSING_PREREQUISITE);
  }
}

async function buildStaticSite(): Promise<void> {
  const { buildSite } = await import('../../site/build-site.js');
  await buildSite();
  console.log('Static site built in site/');
}
