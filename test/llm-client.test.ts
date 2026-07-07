import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLLMClient } from '../src/llm/client.js';
import type { AppConfig } from '../src/config/loader.js';

const baseConfig: AppConfig = {
  provider: 'zhipu',
  apiKey: 'fake',
  model: 'glm-4-flash',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  maxTokens: 1024,
};

describe('llm client', () => {
  it('mock mode returns predefined response', async () => {
    const client = createLLMClient(baseConfig, { mock: true });
    const response = await client.complete({
      system: 'sys',
      user: 'user',
    });
    assert.equal(response, 'mock response');
  });
});
