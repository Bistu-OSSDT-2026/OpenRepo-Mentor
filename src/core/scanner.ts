import { readdir, stat, readFile } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import type { ScanResult } from '../types/index.js';

// ── Constants ──────────────────────────────────────────────────────────

/** Directories excluded from top-level directory listing. */
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.orm',
  'site',
]);

/** Files excluded from language counting. */
const IGNORE_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

/** Maps file extensions to display language names. */
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.css': 'CSS',
  '.html': 'HTML',
};

/** Known config files and their associated tech stack labels. */
const CONFIG_FILE_TECH: Record<string, string> = {
  'package.json': 'Node.js',
  'tsconfig.json': 'TypeScript',
  'tailwind.config.js': 'Tailwind CSS',
  'tailwind.config.ts': 'Tailwind CSS',
  'next.config.js': 'Next.js',
  'next.config.ts': 'Next.js',
  'vite.config.js': 'Vite',
  'vite.config.ts': 'Vite',
  'webpack.config.js': 'Webpack',
  'webpack.config.ts': 'Webpack',
  'Dockerfile': 'Docker',
  '.eslintrc.json': 'ESLint',
  'eslint.config.js': 'ESLint',
  'eslint.config.ts': 'ESLint',
  '.prettierrc': 'Prettier',
  'prettier.config.js': 'Prettier',
  'jest.config.js': 'Jest',
  'jest.config.ts': 'Jest',
  'vitest.config.ts': 'Vitest',
};

/** Maps dependency names to tech stack labels. */
const DEPENDENCY_TECH: Record<string, string> = {
  'react': 'React',
  'vue': 'Vue',
  'next': 'Next.js',
  'express': 'Express',
  'fastify': 'Fastify',
  'tailwindcss': 'Tailwind CSS',
  'prisma': 'Prisma',
  'typeorm': 'TypeORM',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'lodash': 'Lodash',
};

/** Lock-file → package manager mapping, in priority order. */
const LOCK_FILE_MAP: Array<{ file: string; manager: string }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'package-lock.json', manager: 'npm' },
  { file: 'poetry.lock', manager: 'poetry' },
  { file: 'requirements.txt', manager: 'pip' },
];

// ── Public API ─────────────────────────────────────────────────────────

export interface ScanOptions {
  // reserved for future extension (e.g., custom ignore dirs)
}

/**
 * Scan a local repository and return a structured overview.
 *
 * Pure file-system analysis — no LLM calls.
 */
export async function scanRepo(
  repoPath: string,
  _options: ScanOptions = {},
): Promise<ScanResult> {
  const absolutePath = resolve(repoPath);
  const entries = await readdir(absolutePath);

  // 1. Languages (extension counting)
  const languages = await detectLanguages(absolutePath, entries);

  // 2. Package manager (lock-file detection)
  const packageManager = await detectPackageManager(absolutePath, entries);

  // 3. Build / test commands (from package.json)
  const pkg = await readPackageJson(absolutePath);
  const buildCommand = detectBuildCommand(pkg, packageManager);
  const testCommand = detectTestCommand(pkg, packageManager);

  // 4. Tech stack (config files + dependencies)
  const techStack = detectTechStack(entries, absolutePath, pkg);

  // 5. Top-level directories (filter ignored)
  const topLevelDirectories = await detectTopLevelDirectories(absolutePath, entries);

  // 6. Key files
  const keyFiles = detectKeyFiles(entries, absolutePath);

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

// ── Language Detection ────────────────────────────────────────────────

async function detectLanguages(
  rootDir: string,
  _entries: string[],
): Promise<ScanResult['languages']> {
  const counts: Record<string, number> = {};

  async function walk(dirPath: string) {
    let dirEntries: string[];
    try {
      dirEntries = await readdir(dirPath);
    } catch {
      return;
    }

    for (const entry of dirEntries) {
      if (IGNORE_DIRS.has(entry)) continue;
      if (IGNORE_FILES.has(entry)) continue;

      const entryPath = resolve(dirPath, entry);
      try {
        const s = await stat(entryPath);
        if (s.isFile()) {
          const ext = extname(entry).toLowerCase();
          if (!ext) continue;

          const lang = LANGUAGE_MAP[ext];
          if (!lang) continue;

          counts[lang] = (counts[lang] ?? 0) + 1;
        } else if (s.isDirectory()) {
          await walk(entryPath);
        }
      } catch {
        continue;
      }
    }
  }

  await walk(rootDir);

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  if (total === 0) return [];

  // Sort by count descending, pick top 3
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 1000) / 10 }));

  return sorted;
}

// ── Package Manager Detection ─────────────────────────────────────────

async function detectPackageManager(
  rootDir: string,
  entries: string[],
): Promise<string> {
  const entrySet = new Set(entries);

  for (const { file, manager } of LOCK_FILE_MAP) {
    if (entrySet.has(file)) {
      // Verify it's a file (not a directory)
      try {
        const s = await stat(resolve(rootDir, file));
        if (s.isFile()) return manager;
      } catch {
        // stat failed — skip
      }
    }
  }

  // Fallback: if package.json exists, assume npm
  if (entrySet.has('package.json')) {
    return 'npm';
  }

  return 'unknown';
}

// ── Build / Test Command Detection ────────────────────────────────────

async function readPackageJson(rootDir: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(resolve(rootDir, 'package.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function detectBuildCommand(
  pkg: Record<string, unknown> | null,
  packageManager: string,
): string | undefined {
  const scripts = pkg?.scripts as Record<string, string> | undefined;
  if (!scripts) return undefined;

  // Match scripts named 'build', or containing 'build'/'compile'/'dist'
  const match = Object.keys(scripts).find(
    (s) => /^(build|compile|dist)$/.test(s) || /\b(build|compile|dist)\b/.test(s),
  );

  if (!match) return undefined;
  return `${packageManager} run ${match}`;
}

function detectTestCommand(
  pkg: Record<string, unknown> | null,
  packageManager: string,
): string | undefined {
  const scripts = pkg?.scripts as Record<string, string> | undefined;
  if (!scripts) return undefined;

  // Match scripts named 'test', or containing 'test'/'spec'
  const match = Object.keys(scripts).find(
    (s) => /^(test|spec)$/.test(s) || /\b(test|spec)\b/.test(s),
  );

  if (!match) return undefined;
  return `${packageManager} ${match === 'test' ? 'test' : `run ${match}`}`;
}

// ── Tech Stack Detection ──────────────────────────────────────────────

function detectTechStack(
  entries: string[],
  rootDir: string,
  pkg: Record<string, unknown> | null,
): string[] {
  const stack = new Set<string>();
  const entrySet = new Set(entries);

  // Phase 1: config files
  for (const entry of entries) {
    const tech = CONFIG_FILE_TECH[entry];
    if (tech) stack.add(tech);
  }

  // Phase 2: dependency indicators from package.json
  if (pkg) {
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
    };

    for (const dep of Object.keys(deps)) {
      const tech = DEPENDENCY_TECH[dep];
      if (tech) stack.add(tech);
    }
  }

  return Array.from(stack).sort();
}

// ── Top-Level Directories ─────────────────────────────────────────────

async function detectTopLevelDirectories(
  rootDir: string,
  entries: string[],
): Promise<string[]> {
  const dirs: string[] = [];

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;

    try {
      const s = await stat(resolve(rootDir, entry));
      if (s.isDirectory()) {
        dirs.push(entry);
      }
    } catch {
      // stat failed — skip
    }
  }

  return dirs.sort();
}

// ── Key Files Detection ───────────────────────────────────────────────

function detectKeyFiles(
  entries: string[],
  rootDir: string,
): ScanResult['keyFiles'] {
  const entrySet = new Set(entries);

  return {
    readme: entries.some((e) => /^readme/i.test(e)),
    license: entries.some((e) => /^license/i.test(e)),
    contributing: entries.some((e) => /^contributing/i.test(e)),
    ci: entrySet.has('.github') || entries.some((e) => /^\.gitlab/i.test(e)),
  };
}
