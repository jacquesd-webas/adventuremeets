import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './module';
import { loadEnv } from './config/env.loader';

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  
  const bootstrapLogger = new Logger('Bootstrap');
  app.useLogger(bootstrapLogger);
  const logger = bootstrapLogger;
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Meet Planner API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  const apiBaseUrl = process.env.API_BASEURL || "";
  if (!apiBaseUrl) {
    logger?.warn?.('API_BASEURL is not set');
  }
  let host = apiBaseUrl.split('//').pop()!.split(':')[0].split('/')[0];
  if (!host) {
    logger?.warn?.('Unable to determine host from API_BASEURL, defaulting to localhost');
    host = 'localhost';
  }
  let port = parseInt(apiBaseUrl.split(':').pop()!.split('/')[0], 10);
  if (!port || isNaN(port)) {
    logger?.warn?.('Unable to determine port from API_BASEURL, defaulting to 8080');
    port = 8080;
  }
  await app.listen(port);
  logger?.log?.(`API listening on ${host}:${port}`);
}

bootstrap().catch((err) => {
  Logger.error('API bootstrap failed', err);
  process.exit(1);
});
