import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SuperAppService } from './superapp.service';
import { SuperAppController } from './superapp.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  controllers: [SuperAppController],
  providers: [SuperAppService],
  exports: [SuperAppService],
})
export class SuperAppModule {}
