import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generatePlan } from '../../core/planner.js';
import { writePlan } from '../../output/writer.js';
import { ErrorCodes, OrmError } from '../../shared/errors.js';
import type { IssueAnalysis, ScanResult } from '../../types/index.js';

export interface PlanOptions {
  config?: string;
  verbose?: boolean;
  mockLlm?: boolean;
}

export async function planCommand(options: PlanOptions): Promise<void> {
  const scanResult = await readJson<ScanResult>('.orm/scan-report.json');
  const issueResult = await readJson<IssueAnalysis>('.orm/issue-analysis.json');

  if (options.verbose) {
    console.error('Generating contribution plan from .orm/scan-report.json and .orm/issue-analysis.json');
  }

  const plan = await generatePlan(scanResult, issueResult, {
    mock: options.mockLlm,
    configPath: options.config,
  });
  await writePlan(plan);
  console.log('Contribution plan written to .orm/contribution-plan.md');
}

async function readJson<T>(path: string): Promise<T> {
  try {
    const raw = await readFile(resolve(process.cwd(), path), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    throw new OrmError(
      `Missing prerequisite file: ${path}. Run the previous commands first.`,
      ErrorCodes.MISSING_PREREQUISITE
    );
  }
}
