import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Page {
  title: string;
  input: string;
  output: string;
}

const pages: Page[] = [
  { title: 'OpenRepo Mentor', input: 'README.md', output: 'index.html' },
  { title: '使用指南', input: 'docs/user-guide.md', output: 'guide.html' },
  { title: 'Demo 展示', input: 'docs/demo.md', output: 'demo.html' },
  { title: '实践报告', input: '.orm/final-report.md', output: 'report.html' }
];

async function readMarkdownOrFallback(title: string, input: string): Promise<string> {
  try {
    return await readFile(resolve(process.cwd(), input), 'utf-8');
  } catch {
    return `# ${title}\n\n内容待生成。`;
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInline(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    html.push(`<p>${renderInline(paragraphBuffer.join(' '))}</p>`);
    paragraphBuffer = [];
  };

  const flushList = (): void => {
    if (listBuffer.length === 0) {
      return;
    }

    html.push('<ul>');
    for (const item of listBuffer) {
      html.push(`<li>${renderInline(item)}</li>`);
    }
    html.push('</ul>');
    listBuffer = [];
  };

  const flushCodeBlock = (): void => {
    if (!inCodeBlock) {
      return;
    }

    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    codeBuffer = [];
    inCodeBlock = false;
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushParagraph();
      flushList();

      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      html.push(`<h1>${renderInline(line.slice(2).trim())}</h1>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      html.push(`<h2>${renderInline(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      html.push(`<h3>${renderInline(line.slice(4).trim())}</h3>`);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInline(line.slice(2).trim())}</p></blockquote>`);
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCodeBlock();

  return html.join('\n');
}

export async function buildSite(): Promise<void> {
  const cwd = process.cwd();
  const siteDir = resolve(cwd, 'site');
  const templatePath = resolve(cwd, 'site-template/index.html');

  await mkdir(siteDir, { recursive: true });
  await copyFile(templatePath, resolve(siteDir, 'template.html'));

  const template = await readFile(templatePath, 'utf-8');

  for (const page of pages) {
    const markdown = await readMarkdownOrFallback(page.title, page.input);
    const html = template
      .replace('<title>OpenRepo Mentor</title>', `<title>${page.title}</title>`)
      .replace('<article id="content"></article>', `<article id="content">\n${renderMarkdown(markdown)}\n</article>`);

    await writeFile(resolve(siteDir, page.output), html);
  }
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await buildSite();
  console.log('Static site built in site/');
}
