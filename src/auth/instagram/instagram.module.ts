import { Module, forwardRef } from '@nestjs/common';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { AuthModule } from '../auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [forwardRef(() => AuthModule), PrismaModule], controllers: [InstagramController], providers: [InstagramService] })
export class InstagramModule {}
