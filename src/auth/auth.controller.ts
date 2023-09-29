import { Controller, UseGuards, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGaurd } from './local-auth.gaurd';
import { Public } from './jwt.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @UseGuards(LocalAuthGaurd)
  @Post('login')
  login(@Request() req): any {
    return this.authService.login(req.user);
  }
}
