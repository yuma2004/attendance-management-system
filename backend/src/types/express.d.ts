import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      email: string;
      name: string;
      picture?: string | null;
      role: 'USER' | 'ADMIN';
    }
  }
}

export {};

