import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as path from 'path';

import config from './common/config';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 防止跨站脚本攻击
  // @ts-ignore
  app.use(helmet());

  app.useGlobalPipes(new ValidationPipe());

  // 统一封装接口异常时返回数据
  app.useGlobalFilters(new HttpExceptionFilter());
  // 统一封装接口成功时返回数据
  app.useGlobalInterceptors(new TransformInterceptor());

  // 提供静态文件服务，静态文件存储目录为 packages/
  // 客户端请求 URL：http://localhost:3000/download/file.zip
  app.useStaticAssets(path.join(__dirname, '..', 'packages'), {
    index: false,
    prefix: config.publicPath,
  });

  // 全局变量，相当于 windows
  global.__basedir = path.join(__dirname, '..');

  const options = new DocumentBuilder()
    .setTitle('hybrid 离线包平台')
    .setDescription('hybrid 离线包平台 API 描述')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app,options)
  SwaggerModule.setup('/api-docs',app,document)

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
