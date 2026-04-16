// Extend Express Request type if needed
declare namespace Express {
  interface Request {
    // Correlation id for the request
    requestId?: string;
    // Optional authenticated user object (injected by auth middleware or dev injector)
    user?: {
      id?: string;
      user_id?: string;
      email?: string;
      name?: string;
      role?: string;
      [key: string]: any;
    };
  }
}
