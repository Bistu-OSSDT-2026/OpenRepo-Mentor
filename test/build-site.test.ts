import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('buildSite generates site pages and falls back when report is missing', async () => {
  let buildSite: undefined | (() => Promise<void>);

  try {
    ({ buildSite } = await import('../scripts/build-site.ts'));
  } catch (error) {
    assert.fail(`buildSite module is not available yet: ${String(error)}`);
  }

  const workspace = await mkdtemp(join(tmpdir(), 'openrepo-mentor-site-'));
  const originalCwd = process.cwd();

  await mkdir(join(workspace, 'docs'), { recursive: true });
  await mkdir(join(workspace, 'site-template'), { recursive: true });

  await writeFile(join(workspace, 'README.md'), '# Home\n\nProject overview.');
  await writeFile(join(workspace, 'docs', 'demo.md'), '# Demo\n\nSample outputs.');
  await writeFile(join(workspace, 'docs', 'user-guide.md'), '# Guide\n\nHow to use it.');
  await writeFile(
    join(workspace, 'site-template', 'index.html'),
    '<!DOCTYPE html><html><head><title>OpenRepo Mentor</title></head><body><article id="content"></article></body></html>'
  );

  process.chdir(workspace);

  try {
    await buildSite?.();
  } finally {
    process.chdir(originalCwd);
  }

  const homePage = await readFile(join(workspace, 'site', 'index.html'), 'utf-8');
  const demoPage = await readFile(join(workspace, 'site', 'demo.html'), 'utf-8');
  const guidePage = await readFile(join(workspace, 'site', 'guide.html'), 'utf-8');
  const reportPage = await readFile(join(workspace, 'site', 'report.html'), 'utf-8');

  assert.match(homePage, /Project overview\./);
  assert.match(demoPage, /Sample outputs\./);
  assert.match(guidePage, /How to use it\./);
  assert.match(reportPage, /内容待生成/);
});
