import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../src/core/planner.js';
import type { IssueAnalysis, ScanResult } from '../src/types/index.js';

const scanResult: ScanResult = {
  repoPath: '/fake',
  languages: [{ name: 'TypeScript', percentage: 100 }],
  techStack: ['Node.js', 'TypeScript'],
  packageManager: 'npm',
  topLevelDirectories: ['src'],
  keyFiles: { readme: true, license: true, contributing: false, ci: true },
};

const issueResult: IssueAnalysis = {
  summary: 'Fix Windows path handling',
  type: 'bug',
  difficulty: 'medium',
  relatedFiles: ['src/pathMention.ts'],
  suggestedSteps: ['Find path separator usage', 'Use path.sep'],
  risks: ['POSIX compatibility'],
};

describe('planner', () => {
  it('generates a plan in mock mode', async () => {
    const plan = await generatePlan(scanResult, issueResult, { mock: true });
    assert.ok(plan.goal);
    assert.ok(plan.tasks.length > 0);
  });
});
