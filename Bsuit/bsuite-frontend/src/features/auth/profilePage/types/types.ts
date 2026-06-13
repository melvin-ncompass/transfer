export interface Session {
  sessionId: string;
  expiresAt: string;   // or Date if you plan to parse it
  createdAt: string;   // or Date
  browserName: string;
}

export interface User {
  userId: string;
  displayName: string;
  email: string;
  profilePicUrl: string | null;
  twoFAEnabled: boolean;
  sessions: Session[];
}
