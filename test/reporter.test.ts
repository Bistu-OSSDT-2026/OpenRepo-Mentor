import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../src/core/reporter.js';
import type { ReportInput } from '../src/types/index.js';

const input: ReportInput = {
  scanResult: {
    repoPath: '/fake',
    languages: [{ name: 'TypeScript', percentage: 100 }],
    techStack: ['Node.js'],
    packageManager: 'npm',
    topLevelDirectories: ['src'],
    keyFiles: { readme: true, license: true, contributing: false, ci: true },
  },
  issueResult: {
    summary: 'Fix Windows paths',
    type: 'bug',
    difficulty: 'medium',
    relatedFiles: ['src/pathMention.ts'],
    suggestedSteps: ['Find usage', 'Use path.sep'],
    risks: ['POSIX'],
  },
  planResult: {
    goal: 'Fix path separator',
    background: 'Project uses TypeScript.',
    tasks: [{ title: 'Fix', description: 'Use path.sep' }],
    testPlan: 'Run tests',
    prChecklist: ['Add tests'],
  },
};

describe('reporter', () => {
  it('generates final report in mock mode', async () => {
    const report = await generateReport(input, { mock: true });
    assert.ok(report.includes('项目选择'));
  });
});
