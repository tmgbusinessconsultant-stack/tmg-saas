import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SuperAppService } from './superapp.service';
import { SuperAppController } from './superapp.controller';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 60000, // 60s for AI image/video gen
        maxRedirects: 5,
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024,
        headers: {
          'User-Agent': 'TMG-SuperApp-V7/7.0',
        },
      }),
    }),
  ],
  controllers: [SuperAppController],
  providers: [SuperAppService],
  exports: [SuperAppService],
})
export class SuperAppModule { }