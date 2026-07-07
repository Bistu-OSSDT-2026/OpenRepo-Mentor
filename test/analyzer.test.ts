import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIssue, parseIssueAnalysis } from '../src/core/analyzer.js';
import type { ScanResult } from '../src/types/index.js';

const scanResult: ScanResult = {
  repoPath: '/fake/repo',
  languages: [{ name: 'TypeScript', percentage: 100 }],
  techStack: ['Node.js', 'TypeScript'],
  packageManager: 'npm',
  topLevelDirectories: ['src', 'test'],
  keyFiles: {
    readme: true,
    license: true,
    contributing: false,
    ci: false,
  },
};

describe('issue analyzer', () => {
  it('returns structured analysis in mock mode', async () => {
    const analysis = await analyzeIssue(
      '# Bug: Windows path handling fails\n\nsrc/path.ts uses POSIX separators.',
      scanResult,
      { mock: true }
    );

    assert.ok(analysis.summary.length > 0);
    assert.equal(analysis.type, 'bug');
    assert.ok(analysis.relatedFiles.includes('src/path.ts'));
    assert.ok(analysis.suggestedSteps.length > 0);
    assert.ok(analysis.risks.length > 0);
  });

  it('parses JSON issue analysis', () => {
    const analysis = parseIssueAnalysis(`{
      "summary": "Update README",
      "type": "docs",
      "difficulty": "easy",
      "relatedFiles": ["README.md"],
      "suggestedSteps": ["Edit README"],
      "risks": ["Wording may be unclear"]
    }`);

    assert.equal(analysis.type, 'docs');
    assert.equal(analysis.difficulty, 'easy');
    assert.deepEqual(analysis.relatedFiles, ['README.md']);
  });
});
