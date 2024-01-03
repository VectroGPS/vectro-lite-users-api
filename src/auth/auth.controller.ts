import { Controller, UseGuards, Post, Request, Body } from '@nestjs/common';
import { GoogleRecaptchaValidator } from '@nestlab/google-recaptcha';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './jwt.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly reCaptchaValidator: GoogleRecaptchaValidator,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any, @Body('recaptcha') recaptcha: string) {
    const response = await this.reCaptchaValidator.validate({
      response: recaptcha,
    });

    if (!response.success) {
      throw new Error('reCaptcha validation failed');
    }

    return this.authService.login(req.user);
  }
}
