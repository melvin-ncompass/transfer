import { createParamDecorator, ExecutionContext } from "@nestjs/common";

declare global {
  interface UserPayload {
    id: number;
    email: string;
    sessionId: string;
    username: string;
    displayName: string;
  }
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);
