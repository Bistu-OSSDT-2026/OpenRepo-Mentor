import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import type { ScanResult } from '../types/index.js';
import { OrmError, ErrorCodes } from '../shared/errors.js';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.orm', 'site']);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.js': 'JavaScript',
  '.tsx': 'TypeScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.md': 'Markdown',
};

export async function scanRepo(repoPath: string): Promise<ScanResult> {
  const absolutePath = resolve(repoPath);
  try {
    const s = await stat(absolutePath);
    if (!s.isDirectory()) {
      throw new OrmError(`Path is not a directory: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
    }
  } catch {
    throw new OrmError(`Path not found: ${absolutePath}`, ErrorCodes.PATH_NOT_FOUND);
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const topLevelDirectories: string[] = [];
  const extensions: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
      topLevelDirectories.push(entry.name);
    }
  }

  const totalFiles = await collectExtensions(absolutePath, extensions);

  const languages = Object.entries(extensions)
    .map(([ext, count]) => ({
      name: LANGUAGE_MAP[ext] ?? ext,
      percentage: totalFiles > 0 ? (count / totalFiles) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const packageManager = await detectPackageManager(absolutePath);
  const { buildCommand, testCommand } = await detectScripts(absolutePath, packageManager);
  const techStack = await detectTechStack(absolutePath);
  const keyFiles = await detectKeyFiles(absolutePath);

  return {
    repoPath: absolutePath,
    languages,
    techStack,
    packageManager,
    buildCommand,
    testCommand,
    topLevelDirectories,
    keyFiles,
  };
}

async function collectExtensions(dir: string, extensions: Record<string, number>): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true });
  let totalFiles = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        totalFiles += await collectExtensions(resolve(dir, entry.name), extensions);
      }
      continue;
    }

    if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext) {
        extensions[ext] = (extensions[ext] ?? 0) + 1;
        totalFiles++;
      }
    }
  }

  return totalFiles;
}

async function detectPackageManager(repoPath: string): Promise<string> {
  const files = await readdir(repoPath);
  if (files.includes('pnpm-lock.yaml')) return 'pnpm';
  if (files.includes('yarn.lock')) return 'yarn';
  if (files.includes('package-lock.json') || files.includes('package.json')) return 'npm';
  if (files.includes('poetry.lock') || files.includes('pyproject.toml')) return 'poetry';
  if (files.includes('requirements.txt')) return 'pip';
  return 'unknown';
}

async function detectScripts(
  repoPath: string,
  packageManager: string
): Promise<{ buildCommand?: string; testCommand?: string }> {
  if (!['npm', 'yarn', 'pnpm'].includes(packageManager)) {
    return {};
  }
  try {
    const raw = await readFile(resolve(repoPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const scripts = pkg.scripts ?? {};
    const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;
    const buildCommand = findScript(scripts, ['build', 'compile', 'dist']);
    const testCommand = findScript(scripts, ['test', 'spec']);
    return {
      buildCommand: buildCommand ? `${runCmd} ${buildCommand}` : undefined,
      testCommand: testCommand ? `${runCmd} ${testCommand}` : undefined,
    };
  } catch {
    return {};
  }
}

function findScript(scripts: Record<string, string>, keywords: string[]): string | undefined {
  return Object.keys(scripts).find((name) => keywords.some((k) => name.toLowerCase().includes(k)));
}

async function detectTechStack(repoPath: string): Promise<string[]> {
  const stack: string[] = [];
  const files = await readdir(repoPath);

  const checks: Array<[string, string | string[], string]> = [
    ['package.json', 'Node.js', 'Node.js'],
    ['tsconfig.json', 'TypeScript', 'TypeScript'],
    ['pyproject.toml', 'Python', 'Python'],
    ['requirements.txt', 'Python', 'Python'],
    ['go.mod', 'Go', 'Go'],
    ['Cargo.toml', 'Rust', 'Rust'],
    ['pom.xml', 'Java', 'Java'],
    ['build.gradle', 'Java', 'Java'],
  ];

  for (const [filename, _indicator, label] of checks) {
    if (files.includes(filename)) stack.push(label);
  }

  try {
    const raw = await readFile(resolve(repoPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const deps = Object.keys(pkg.dependencies ?? {});
    if (deps.includes('commander')) stack.push('commander');
    if (deps.includes('chalk')) stack.push('chalk');
    if (deps.includes('react')) stack.push('React');
    if (deps.includes('vue')) stack.push('Vue');
    if (deps.includes('express')) stack.push('Express');
    if (deps.includes('fastify')) stack.push('Fastify');
  } catch {
    // ignore
  }

  return [...new Set(stack)];
}

async function detectKeyFiles(repoPath: string): Promise<ScanResult['keyFiles']> {
  const files = await readdir(repoPath);
  const hasCi = files.some((f) => f === '.github' || f.startsWith('.gitlab'));
  return {
    readme: files.some((f) => /^readme/i.test(f)),
    license: files.some((f) => /^license/i.test(f)),
    contributing: files.some((f) => /^contributing/i.test(f)),
    ci: hasCi,
  };
}
