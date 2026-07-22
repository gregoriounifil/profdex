import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true, // aceita qualquer origem (dev local + celular na mesma rede)
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // O Railway roteia o domínio público para o Target Port fixado deste
  // serviço (3000), que NÃO coincide com a PORT que o Railway injeta em
  // runtime. Por isso escutamos explicitamente em 3000/0.0.0.0 — senão o
  // edge proxy tenta 3000, o app está em outra porta, e retorna 502
  // "connection refused".
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
