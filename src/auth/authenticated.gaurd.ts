import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AuthenticatedGaurd implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return request.isAuthenticated();
  }
}
