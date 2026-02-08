export class APIError extends Error {
  status?: number;
  response?: Response;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status?: number,
    response?: Response,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);

    this.name = 'APIError';
    this.status = status;
    this.response = response;
    this.fieldErrors = fieldErrors;
  }
}
