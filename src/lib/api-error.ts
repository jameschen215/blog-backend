export class APIError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

export function createAPIError(statusCode: number, message: string): APIError {
  return new APIError(statusCode, message);
}
