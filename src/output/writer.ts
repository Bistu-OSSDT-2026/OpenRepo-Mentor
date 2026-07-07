import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ScanResult, IssueAnalysis, ContributionPlan } from '../types/index.js';
import {
  formatScanReport,
  formatIssueAnalysis,
  formatPlan,
} from './formatter.js';

export const ORM_DIR = '.orm';

export async function ensureOrmDir(): Promise<string> {
  const dir = resolve(process.cwd(), ORM_DIR);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeScanReport(result: ScanResult): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'scan-report.json'), JSON.stringify(result, null, 2));
  await writeFile(resolve(dir, 'scan-report.md'), formatScanReport(result));
}

export async function writeIssueAnalysis(result: IssueAnalysis): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'issue-analysis.json'), JSON.stringify(result, null, 2));
  await writeFile(resolve(dir, 'issue-analysis.md'), formatIssueAnalysis(result));
}

export async function writePlan(plan: ContributionPlan): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'contribution-plan.md'), formatPlan(plan));
}

export async function writeReport(markdown: string): Promise<void> {
  const dir = await ensureOrmDir();
  await writeFile(resolve(dir, 'final-report.md'), markdown);
}
