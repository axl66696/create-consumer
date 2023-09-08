import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NatsJetStreamServer } from './jetstream/jetstream.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appService = app.get(NatsJetStreamServer);

  // 這裡只有 connectionOptions 有用，其他兩個配置要在jetstream serivce使用
  appService.options = {
    connectionOptions: {
      name: 'create',
      servers: 'localhost:4222',
    },
    consumerOptions: {},
    streamConfig: { name: 'xxx', subjects: ['123'] },
  };
  appService.connect();
}
bootstrap();
