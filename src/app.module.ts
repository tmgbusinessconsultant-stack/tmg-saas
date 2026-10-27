import { Module }
import { SuperAppModule } from './superapp/superapp.module'; from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GymsModule } from './gyms/gyms.module';
import { PlansModule } from './plans/plans.module';
import { UserPlansModule } from './user-plans/user-plans.module';
import { MembersModule } from './members/members.module';
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
import { BusinessPlansModule } from './business-plans/business-plans.module';
import { RiskAssessmentsModule } from './risk-assessments/risk-assessments.module';
import { ProductivityPlansModule } from './productivity-plans/productivity-plans.module';
import { PaypalModule } from './paypal/paypal.module';

@Module({
  imports: [
    SuperAppModule,
    PrismaModule,
    AuthModule,
    GymsModule,
    PlansModule,
    UserPlansModule,
    MembersModule,
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
    BusinessPlansModule,
    RiskAssessmentsModule,
    ProductivityPlansModule,
    PaypalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

