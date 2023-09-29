import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
      'http://162.248.55.111:30009',
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(4001);
}
bootstrap();
