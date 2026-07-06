import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config/loader.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('config loader', () => {
  it('loads api key from env var', async () => {
    process.env.ORM_ZHIPU_API_KEY = 'test-key';
    const config = await loadConfig({});
    assert.equal(config.apiKey, 'test-key');
    delete process.env.ORM_ZHIPU_API_KEY;
  });

  it('loads from .ormrc file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orm-'));
    const configPath = join(dir, '.ormrc');
    writeFileSync(configPath, JSON.stringify({ apiKey: 'rc-key', model: 'glm-4-air' }));
    const config = await loadConfig({ configPath });
    assert.equal(config.apiKey, 'rc-key');
    assert.equal(config.model, 'glm-4-air');
  });

  it('throws when api key is missing', async () => {
    delete process.env.ORM_ZHIPU_API_KEY;
    await assert.rejects(() => loadConfig({}), /API key/);
  });
});
