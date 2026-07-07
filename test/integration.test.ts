import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanRepo } from '../src/core/scanner.js';
import { analyzeIssue } from '../src/core/analyzer.js';
import { generatePlan } from '../src/core/planner.js';
import { generateReport } from '../src/core/reporter.js';

describe('integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'orm-int-'));
    mkdirSync(join(tmpDir, 'src'));
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } })
    );
    writeFileSync(join(tmpDir, 'src', 'index.ts'), 'export const x = 1;');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs full pipeline in mock mode', async () => {
    const scan = await scanRepo(tmpDir);
    assert.equal(scan.packageManager, 'npm');

    const issue = 'Fix the demo bug in index.ts';
    const analysis = await analyzeIssue(issue, scan, { mock: true });
    assert.ok(analysis.summary);

    const plan = await generatePlan(scan, analysis, { mock: true });
    assert.ok(plan.goal);

    const report = await generateReport({ scanResult: scan, issueResult: analysis, planResult: plan }, { mock: true });
    assert.ok(report.includes('#'));
  });
});
