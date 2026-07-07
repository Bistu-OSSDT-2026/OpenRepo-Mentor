import { Command } from 'commander';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { issueAnalyzeCommand } from './commands/issue.js';
import { planCommand } from './commands/plan.js';
import { reportCommand } from './commands/report.js';
import { scanCommand } from './commands/scan.js';

const program = new Command('orm')
  .description('OpenRepo Mentor: a CLI for student open-source practice')
  .version('0.1.0');

program
  .command('scan <repo-path>')
  .description('Scan a local repository and generate an overview')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .action(
    async (
      repoPath: string,
      options: { config?: string; verbose?: boolean },
    ) => {
      await scanCommand(repoPath, options);
    },
  );

const issueCommand = program.command('issue').description('Issue commands');

issueCommand
  .command('analyze <issue-file>')
  .description('Analyze a local issue file')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .action(
    async (
      issueFile: string,
      options: { config?: string; verbose?: boolean; mockLlm?: boolean }
    ) => {
      await issueAnalyzeCommand(issueFile, options);
    }
  );

program
  .command('plan')
  .description('Generate a contribution plan')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .action(
    async (options: { config?: string; verbose?: boolean; mockLlm?: boolean }) => {
      await planCommand(options);
    }
  );

program
  .command('report')
  .description('Generate the final practice report')
  .option('--config <path>', 'Path to config file')
  .option('--verbose', 'Print verbose logs')
  .option('--mock-llm', 'Use mock LLM responses')
  .option('--site', 'Build static site after report')
  .option('--members <names>', 'Comma-separated team member names')
  .action(
    async (options: {
      config?: string;
      verbose?: boolean;
      mockLlm?: boolean;
      site?: boolean;
      members?: string;
    }) => {
      await reportCommand(options);
    }
  );

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && currentFile === resolve(process.argv[1])) {
  await program.parseAsync(process.argv);
}

export { program };
