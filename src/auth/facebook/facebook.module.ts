import { Module, forwardRef } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { AuthModule } from '../auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [FacebookController],
  providers: [FacebookService],
})
export class FacebookModule {}
