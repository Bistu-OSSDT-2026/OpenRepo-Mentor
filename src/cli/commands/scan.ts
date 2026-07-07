import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scanRepo } from '../../core/scanner.js';
import { writeScanReport } from '../../output/writer.js';
import { OrmError, ErrorCodes } from '../../shared/errors.js';

export interface ScanCommandOptions {
  config?: string;
  verbose?: boolean;
}

/**
 * CLI handler for `orm scan <repo-path>`.
 *
 * Scans a local repository and writes a structured report to `.orm/`.
 * This is a pure file-system analysis — no LLM calls, no API key needed.
 */
export async function scanCommand(
  repoPath: string,
  options: ScanCommandOptions = {},
): Promise<void> {
  const absolutePath = resolve(repoPath);

  // Validate that the target directory exists
  try {
    const s = await stat(absolutePath);
    if (!s.isDirectory()) {
      throw new OrmError(
        `Path is not a directory: ${absolutePath}`,
        ErrorCodes.PATH_NOT_FOUND,
      );
    }
  } catch (err) {
    if (err instanceof OrmError) throw err;
    throw new OrmError(
      `Repository path not found: ${absolutePath}`,
      ErrorCodes.PATH_NOT_FOUND,
    );
  }

  if (options.verbose) {
    console.error(`Scanning repository: ${absolutePath}`);
  }

  const result = await scanRepo(absolutePath);

  if (options.verbose) {
    console.error(`Detected languages: ${result.languages.map((l) => l.name).join(', ') || 'none'}`);
    console.error(`Package manager: ${result.packageManager}`);
    console.error(`Tech stack: ${result.techStack.join(', ') || 'none'}`);
  }

  await writeScanReport(result);
  console.log('Scan report written to .orm/scan-report.md');
}
