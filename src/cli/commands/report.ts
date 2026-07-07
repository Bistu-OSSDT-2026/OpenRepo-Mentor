import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateReport } from '../../core/reporter.js';
import { writeReport } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';
import type { GlobalOptions } from './scan.js';
import type { ScanResult, IssueAnalysis, ContributionPlan } from '../../types/index.js';

async function readJson<T>(path: string): Promise<T> {
  try {
    const raw = await readFile(resolve(process.cwd(), path), 'utf-8');
    return JSON.parse(raw);
  } catch {
    throw new OrmError(`Missing prerequisite file: ${path}`, ErrorCodes.MISSING_PREREQUISITE);
  }
}

async function buildStaticSite(): Promise<void> {
  const { buildSite } = await import('../../site/build-site.js');
  await buildSite();
  console.log('Static site built in site/');
}

export async function reportCommand(options: GlobalOptions & { site?: boolean; members?: string }): Promise<void> {
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

  const planResult: ContributionPlan = {
    goal: scanResult.repoPath,
    background: planMarkdown,
    tasks: [],
    testPlan: '',
    prChecklist: [],
  };

  const members = options.members ? options.members.split(',').map((m) => m.trim()) : undefined;
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
