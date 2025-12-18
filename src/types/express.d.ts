import { Role } from '../generated/prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      role: Role;
    }
  }
}
