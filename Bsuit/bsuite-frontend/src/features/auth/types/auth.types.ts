export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string,
  password: string,
  displayName: string,
}

export interface ConfirmResetPasswordPayload {
  token?: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string | null;
}