import { Module, forwardRef } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { AuthModule } from '../auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [GoogleController],
  providers: [GoogleService],
})
export class GoogleModule {}
