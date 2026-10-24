import { Module } from "@nestjs/common";
import { ProductivityPlansController } from "./productivity-plans.controller";
import { ProductivityPlansService } from "./productivity-plans.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AiModule } from "../ai/ai.module";
import { UserPlansModule } from "../user-plans/user-plans.module";
@Module({
  imports: [PrismaModule, AiModule, UserPlansModule],
  controllers: [ProductivityPlansController],
  providers: [ProductivityPlansService],
  exports: [ProductivityPlansService],
})
export class ProductivityPlansModule {}
