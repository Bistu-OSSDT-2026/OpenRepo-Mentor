const HELP_TEXT = `OpenRepo Mentor: a CLI for student open-source practice

Usage:
  orm scan <repo-path>
  orm issue analyze <issue-file>
  orm plan
  orm report [--site] [--members "A,B"]
`;

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function run(args: string[]): Promise<void> {
  const [command, subcommand, value] = args;

  if (!command || hasFlag(args, '--help') || hasFlag(args, '-h')) {
    console.log(HELP_TEXT);
    return;
  }

  if (command === 'scan' && value) {
    console.log(`scan: ${value}`);
    return;
  }

  if (command === 'issue' && subcommand === 'analyze' && args[2]) {
    console.log(`issue analyze: ${args[2]}`);
    return;
  }

  if (command === 'plan') {
    console.log('plan');
    return;
  }

  if (command === 'report') {
    console.log('report');

    if (hasFlag(args, '--site')) {
      const { buildSite } = await import('../../scripts/build-site.ts');
      await buildSite();
      console.log('Static site built in site/');
    }
    return;
  }

  console.log(HELP_TEXT);
}

const program = {
  async parse(argv: string[] = process.argv): Promise<void> {
    await run(argv.slice(2));
  }
};

if (import.meta.main) {
  await program.parse();
}

export { program };
