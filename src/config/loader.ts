import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { OrmError, ErrorCodes } from '../shared/errors.js';

export interface AppConfig {
  provider: 'zhipu';
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
}

const DEFAULT_CONFIG: AppConfig = {
  provider: 'zhipu',
  apiKey: '',
  model: 'glm-4-flash',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  maxTokens: 4096,
};

export async function loadConfig(options: { configPath?: string } = {}): Promise<AppConfig> {
  const config: AppConfig = { ...DEFAULT_CONFIG };

  const configPath = options.configPath ?? resolve(process.cwd(), '.ormrc');
  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.assign(config, parsed);
  } catch (err) {
    if (options.configPath) {
      throw new OrmError(`Cannot read config file: ${configPath}`, ErrorCodes.INVALID_CONFIG);
    }
  }

  if (process.env.ORM_ZHIPU_API_KEY) {
    config.apiKey = process.env.ORM_ZHIPU_API_KEY;
  }
  if (process.env.ORM_MODEL) {
    config.model = process.env.ORM_MODEL;
  }
  if (process.env.ORM_MAX_TOKENS) {
    config.maxTokens = Number(process.env.ORM_MAX_TOKENS);
  }

  if (!config.apiKey) {
    throw new OrmError(
      'Missing Zhipu API key. Set ORM_ZHIPU_API_KEY or add apiKey to .ormrc.',
      ErrorCodes.MISSING_API_KEY
    );
  }

  return config;
}
