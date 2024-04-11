import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}
  public async sendResetPasswordEmail(
    to: string,
    token: string,
    platform = 'Vectro Lite',
  ): Promise<void> {
    const url = `https://lite.vectro.com.mx/reset-password?token=${token}`;
    return await this.mailerService.sendMail({
      to,
      subject: 'Restablecer contraseña',
      template: 'reset-password',
      context: {
        url,
        platform,
      },
    });
  }
}
