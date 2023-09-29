import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRoles } from 'src/user/interfaces/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('RolesGuard.canActivate()');
    const requiredRoles = this.reflector.getAllAndOverride<UserRoles[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
      // throw new HttpException('Unauthorized, no user', HttpStatus.UNAUTHORIZED);
    }
    // console.log('user', user);
    return requiredRoles.some((role: string) => user?.role === role);
  }

  handleRequest(err, user, info) {
    console.log('RolesGuard.handleRequest()', err, user, info);
    if (err || !user) {
      throw (
        err ||
        new HttpException(
          'not session active or not have access to this resource',
          HttpStatus.UNAUTHORIZED,
        )
      );
    }
    return user;
  }
}
