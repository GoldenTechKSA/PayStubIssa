/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new HttpError(400, code, message, details);
export const unauthorized = (code: string, message: string) => new HttpError(401, code, message);
export const notFound = (code: string, message: string) => new HttpError(404, code, message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);
export const paymentRequired = (code: string, message: string) => new HttpError(402, code, message);
export const badGateway = (code: string, message: string, details?: unknown) =>
  new HttpError(502, code, message, details);
