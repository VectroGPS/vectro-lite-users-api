import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  app.enableCors({
    // origin: [
    //   'http://localhost:5173',
    //   'http://localhost:4173',
    //   'http://localhost:3000',
    //   'http://162.248.55.111:30009',
    // ],
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(configService.get('PORT') || 3000, () => {
    console.log(`Server running on port ${configService.get('PORT') || 3000}`);
  });
}
bootstrap();
