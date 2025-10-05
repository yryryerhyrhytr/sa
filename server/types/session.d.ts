import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      role: string;
      name: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
      smsCount?: number;
      batchId?: string;
    };
  }
}
