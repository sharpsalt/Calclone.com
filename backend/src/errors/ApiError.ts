export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(msg = 'Bad Request', details?: unknown) {
    return new ApiError(400, msg, 'BAD_REQUEST', details);
  }

  static notFound(msg = 'Not Found', details?: unknown) {
    return new ApiError(404, msg, 'NOT_FOUND', details);
  }

  static conflict(msg = 'Conflict', details?: unknown) {
    return new ApiError(409, msg, 'CONFLICT', details);
  }

  static internal(msg = 'Internal Server Error', details?: unknown) {
    return new ApiError(500, msg, 'INTERNAL_SERVER_ERROR', details);
  }
}

export default ApiError;
