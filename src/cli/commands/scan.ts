import { scanRepo } from '../../core/scanner.js';
import { writeScanReport } from '../../output/writer.js';
import { loadConfig } from '../../config/loader.js';

export interface GlobalOptions {
  config?: string;
  verbose?: boolean;
  mockLlm?: boolean;
}

export async function scanCommand(repoPath: string, options: GlobalOptions): Promise<void> {
  if (!options.mockLlm) {
    const config = await loadConfig({ configPath: options.config });
    if (options.verbose) {
      console.error(`Using model: ${config.model}`);
    }
  }

  const result = await scanRepo(repoPath);
  await writeScanReport(result);
  console.log(`Scan report written to .orm/scan-report.md`);
}
