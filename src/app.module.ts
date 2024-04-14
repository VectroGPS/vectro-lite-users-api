import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user/user.service';
import { JwtAuthGaurd } from './auth/jwt-auth.gaurd';
import { RolesGuard } from './auth/roles.guard';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { FilesModule } from './files/files.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      // public
      serveRoot: '/uploads',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGODB_CONNECTION_STRING'),
        useNewUrlParser: true,
        dbName: config.get('MONGODB_DATABASE') || 'Vectro_Lite',
      }),
      inject: [ConfigService],
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secretKey: config.get('GOOGLE_RECAPTCHA_SECRET_KEY'),
        response: (req) => req.body.recaptcha,
        actions: ['login'],
        score: 0.8,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get('JWT_SECRET'),
        // secretOrPrivateKey: configService.get('JWT_SECRET'),
        signOptions: {
          // expiresIn: 3600,
          // 1 week
          expiresIn: 604800,
        },
      }),
      inject: [ConfigService],
    }),
    FilesModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGaurd,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
