import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { marked } from 'marked';

interface Page {
  title: string;
  input: string;
  output: string;
}

const pages: Page[] = [
  { title: 'OpenRepo Mentor', input: 'README.md', output: 'index.html' },
  { title: '使用指南', input: 'docs/user-guide.md', output: 'guide.html' },
  { title: 'Demo 展示', input: 'docs/demo.md', output: 'demo.html' },
  { title: '实践报告', input: '.orm/final-report.md', output: 'report.html' },
];

async function readMarkdownOrFallback(title: string, input: string): Promise<string> {
  try {
    return await readFile(resolve(process.cwd(), input), 'utf-8');
  } catch {
    return `# ${title}\n\n内容待生成。`;
  }
}

export async function buildSite(): Promise<void> {
  const cwd = process.cwd();
  const siteDir = resolve(cwd, 'site');
  const templatePath = resolve(cwd, 'site-template/index.html');
  const template = await readFile(templatePath, 'utf-8');

  await mkdir(siteDir, { recursive: true });

  for (const page of pages) {
    const markdown = await readMarkdownOrFallback(page.title, page.input);
    const html = template
      .replace('<title>OpenRepo Mentor</title>', `<title>${page.title}</title>`)
      .replace('<article id="content"></article>', `<article id="content">\n${marked.parse(markdown)}\n</article>`);

    await writeFile(resolve(siteDir, page.output), html);
  }
}
