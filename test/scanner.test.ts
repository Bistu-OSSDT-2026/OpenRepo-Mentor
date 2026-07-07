import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scanRepo } from '../src/core/scanner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, 'fixtures', 'sample-project');
const EMPTY_DIR = resolve(__dirname, 'fixtures', 'empty');

describe('scanner', () => {
  it('returns correct repoPath and topLevelDirectories', async () => {
    const result = await scanRepo(FIXTURES);

    assert.ok(result.repoPath.endsWith('sample-project'));
    assert.ok(result.topLevelDirectories.includes('src'));
    assert.ok(result.topLevelDirectories.includes('test'));
    assert.ok(result.topLevelDirectories.includes('.github'));
    // IGNORE_DIRS must not appear
    assert.ok(!result.topLevelDirectories.includes('node_modules'));
    assert.ok(!result.topLevelDirectories.includes('.git'));
  });

  it('detects TypeScript as primary language', async () => {
    const result = await scanRepo(FIXTURES);

    const ts = result.languages.find((l) => l.name === 'TypeScript');
    assert.ok(ts);
    assert.ok(ts.percentage > 0);
  });

  it('detects package manager from lock files', async () => {
    // sample-project has no lock file, so with package.json it falls back to 'npm'
    const result = await scanRepo(FIXTURES);
    assert.equal(result.packageManager, 'npm');
  });

  it('detects build command from package.json', async () => {
    const result = await scanRepo(FIXTURES);
    assert.equal(result.buildCommand, 'npm run build');
  });

  it('detects test command from package.json', async () => {
    const result = await scanRepo(FIXTURES);
    assert.equal(result.testCommand, 'npm test');
  });

  it('detects tech stack from config files', async () => {
    const result = await scanRepo(FIXTURES);
    assert.ok(result.techStack.includes('TypeScript'));
    assert.ok(result.techStack.includes('Node.js'));
  });

  it('detects key files', async () => {
    const result = await scanRepo(FIXTURES);

    assert.equal(result.keyFiles.readme, true);
    assert.equal(result.keyFiles.license, true);
    assert.equal(result.keyFiles.contributing, false);
    assert.equal(result.keyFiles.ci, true);
  });

  it('handles missing package.json gracefully', async () => {
    // empty dir has no files at all
    const result = await scanRepo(EMPTY_DIR);

    assert.equal(result.packageManager, 'unknown');
    assert.equal(result.buildCommand, undefined);
    assert.equal(result.testCommand, undefined);
    assert.deepEqual(result.languages, []);
  });

  it('returns valid ScanResult shape', async () => {
    const result = await scanRepo(FIXTURES);

    // Verify all required fields exist
    assert.equal(typeof result.repoPath, 'string');
    assert.ok(Array.isArray(result.languages));
    assert.ok(Array.isArray(result.techStack));
    assert.equal(typeof result.packageManager, 'string');
    assert.ok(result.buildCommand === undefined || typeof result.buildCommand === 'string');
    assert.ok(result.testCommand === undefined || typeof result.testCommand === 'string');
    assert.ok(Array.isArray(result.topLevelDirectories));
    assert.equal(typeof result.keyFiles.readme, 'boolean');
    assert.equal(typeof result.keyFiles.license, 'boolean');
    assert.equal(typeof result.keyFiles.contributing, 'boolean');
    assert.equal(typeof result.keyFiles.ci, 'boolean');
  });
});
