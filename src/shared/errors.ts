export class OrmError extends Error {
  constructor(
    message: string,
    public readonly code: number
  ) {
    super(message);
    this.name = 'OrmError';
  }
}

export const ErrorCodes = {
  MISSING_API_KEY: 1,
  PATH_NOT_FOUND: 2,
  MISSING_PREREQUISITE: 3,
  LLM_CALL_FAILED: 4,
  OUTPUT_WRITE_FAILED: 5,
  INVALID_CONFIG: 6,
} as const;
