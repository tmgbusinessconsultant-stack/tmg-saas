import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';
import { PaymentsModule } from './payments/payments.module';
import { ProjectsModule } from './projects/projects.module';
import { ContentModule } from './content/content.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SettingsModule } from './settings/settings.module';
import { AiModule } from './ai/ai.module';
import { AdminManagementModule } from './admin-management/admin-management.module';
import { CvDocumentsModule } from './cv-documents/cv-documents.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GymsModule,
    PlansModule,
    MembersModule,
    SubscriptionsModule,
    GymModule,
    StatsModule,
    QuoteRequestsModule,
    PaymentsModule,
    ProjectsModule,
    ContentModule,
    IntegrationsModule,
    SettingsModule,
    AiModule,
    AdminManagementModule,
    CvDocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
