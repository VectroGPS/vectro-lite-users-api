import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport:
        'smtps://software@vectro.com.mx:Vectro2020.100@mx50.hostgator.mx',
      defaults: {
        from: 'Vectro Lite <notificaciones@vectro.xyz>',
      },
      template: {
        // dir: __dirname + '/email.template.html',
        dir: join(__dirname, '..', '..', 'emailTemplate'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
