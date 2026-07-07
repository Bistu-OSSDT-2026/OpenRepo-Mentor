import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from '../src/site/build-site.js';

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await buildSite();
  console.log('Static site built in site/');
}

export { buildSite };
