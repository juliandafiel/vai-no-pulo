import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Aumenta o limite do body para 50MB (para upload de imagens em base64)
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    app.enableCors();

    const config = new DocumentBuilder()
        .setTitle('Transport System API')
        .setDescription('API for Transport System')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Escuta em 0.0.0.0 para aceitar conexões de dispositivos externos (celulares)
    await app.listen(3000, '0.0.0.0');
}
bootstrap();
