import { Module } from "@nestjs/common";
import { RiskAssessmentsController } from "./risk-assessments.controller";
import { RiskAssessmentsService } from "./risk-assessments.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AiModule } from "../ai/ai.module";
import { UserPlansModule } from "../user-plans/user-plans.module";
@Module({
  imports: [PrismaModule, AiModule, UserPlansModule],
  controllers: [RiskAssessmentsController],
  providers: [RiskAssessmentsService],
  exports: [RiskAssessmentsService],
})
export class RiskAssessmentsModule {}
