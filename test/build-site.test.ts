import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('buildSite', () => {
  it('generates pages from markdown sources with fallback report content', async () => {
    const { buildSite } = await import('../scripts/build-site.js');
    const workspace = await mkdtemp(join(tmpdir(), 'orm-site-'));
    const originalCwd = process.cwd();

    await mkdir(join(workspace, 'docs'), { recursive: true });
    await mkdir(join(workspace, 'site-template'), { recursive: true });

    await writeFile(join(workspace, 'README.md'), '# Home\n\nProject overview.');
    await writeFile(join(workspace, 'docs', 'user-guide.md'), '# Guide\n\nHow to use it.');
    await writeFile(
      join(workspace, 'site-template', 'index.html'),
      '<!DOCTYPE html><html><head><title>OpenRepo Mentor</title></head><body><article id="content"></article></body></html>'
    );

    process.chdir(workspace);

    try {
      await buildSite();
    } finally {
      process.chdir(originalCwd);
    }

    const homePage = await readFile(join(workspace, 'site', 'index.html'), 'utf-8');
    const guidePage = await readFile(join(workspace, 'site', 'guide.html'), 'utf-8');
    const reportPage = await readFile(join(workspace, 'site', 'report.html'), 'utf-8');

    assert.match(homePage, /Project overview\./);
    assert.match(guidePage, /How to use it\./);
    assert.match(reportPage, /内容待生成/);
  });

  it('builds the site when report command receives --site', async () => {
    const { program } = await import('../src/cli/program.js');
    const workspace = await mkdtemp(join(tmpdir(), 'orm-report-site-'));
    const originalCwd = process.cwd();

    await mkdir(join(workspace, 'docs'), { recursive: true });
    await mkdir(join(workspace, 'site-template'), { recursive: true });
    await mkdir(join(workspace, '.orm'), { recursive: true });

    await writeFile(join(workspace, 'README.md'), '# Home\n\nProject overview.');
    await writeFile(join(workspace, 'docs', 'user-guide.md'), '# Guide\n\nHow to use it.');
    await writeFile(join(workspace, '.orm', 'final-report.md'), '# Report\n\nReady to publish.');
    await writeFile(
      join(workspace, 'site-template', 'index.html'),
      '<!DOCTYPE html><html><head><title>OpenRepo Mentor</title></head><body><article id="content"></article></body></html>'
    );

    process.chdir(workspace);

    try {
      await program.parseAsync(['report', '--site'], { from: 'user' });
    } finally {
      process.chdir(originalCwd);
    }

    const reportPage = await readFile(join(workspace, 'site', 'report.html'), 'utf-8');
    assert.match(reportPage, /Ready to publish\./);
  });
});
