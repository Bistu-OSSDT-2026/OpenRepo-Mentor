import { Command } from 'commander';

const program = new Command('orm')
  .description('OpenRepo Mentor: a CLI for student open-source practice')
  .version('0.1.0');

program
  .command('scan <repo-path>')
  .description('Scan a local repository and generate an overview')
  .action(async (repoPath: string) => {
    console.log(`scan: ${repoPath}`);
  });

program
  .command('issue')
  .command('analyze <issue-file>')
  .description('Analyze a local issue file')
  .action(async (issueFile: string) => {
    console.log(`issue analyze: ${issueFile}`);
  });

program
  .command('plan')
  .description('Generate a contribution plan')
  .action(async () => {
    console.log('plan');
  });

program
  .command('report')
  .description('Generate the final practice report')
  .option('--site', 'Build static site after report')
  .action(async (options: { site?: boolean }) => {
    console.log('report');

    if (options.site) {
      const { buildSite } = await import('../site/build-site.js');
      await buildSite();
      console.log('Static site built in site/');
    }
  });

export { program };
