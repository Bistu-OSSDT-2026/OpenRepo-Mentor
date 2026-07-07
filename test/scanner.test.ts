import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanRepo } from '../src/core/scanner.js';
import { resolve } from 'node:path';

const fixturePath = resolve(process.cwd(), 'test/fixtures/sample-project');

describe('scanner', () => {
  it('detects TypeScript project and npm', async () => {
    const result = await scanRepo(fixturePath);
    assert.equal(result.packageManager, 'npm');
    assert.ok(result.languages.some((l) => l.name === 'TypeScript'));
    assert.equal(result.buildCommand, 'npm run build');
    assert.equal(result.testCommand, 'npm run test');
    assert.ok(result.keyFiles.readme);
    assert.ok(result.keyFiles.license);
  });
});
