import { Controller, Post, Get, Param, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../user-plans/plan.guard";
import { RiskAssessmentsService } from "./risk-assessments.service";

@Controller("risk-assessments")
@UseGuards(JwtAuthGuard, PlanGuard)
export class RiskAssessmentsController {
  constructor(private readonly service: RiskAssessmentsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    // Tool ID for PlanGuard = risk-assessment (set via header or metadata)
    req.toolId = "risk-assessment";
    return this.service.generate(req.user, body);
  }

  @Get()
  list(@Req() req: any) { return this.service.list(req.user); }

  @Get(":id")
  getOne(@Req() req: any, @Param("id") id: string) { return this.service.get(req.user, id); }
}
