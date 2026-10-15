import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GymsModule } from './gyms/gyms.module';
import { PlansModule } from './plans/plans.module';
import { MembersModule } from './members/members.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GymModule } from './gym/gym.module';
import { StatsModule } from './stats/stats.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, AuthModule, GymsModule, PlansModule, MembersModule, SubscriptionsModule, GymModule, StatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
