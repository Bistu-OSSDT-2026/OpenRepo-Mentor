import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIssue } from '../src/core/analyzer.js';
import type { ScanResult } from '../src/types/index.js';

const scanResult: ScanResult = {
  repoPath: '/fake',
  languages: [{ name: 'TypeScript', percentage: 100 }],
  techStack: ['Node.js', 'TypeScript'],
  packageManager: 'npm',
  topLevelDirectories: ['src'],
  keyFiles: { readme: true, license: true, contributing: false, ci: true },
};

describe('analyzer', () => {
  it('returns structured analysis in mock mode', async () => {
    const issue = 'Fix Windows path handling in pathMention.';
    const result = await analyzeIssue(issue, scanResult, { mock: true });
    assert.equal(typeof result.summary, 'string');
    assert.ok(result.relatedFiles.length > 0);
  });
});
