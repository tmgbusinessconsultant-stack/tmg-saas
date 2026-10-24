import { Controller, Post, Get, Param, UseGuards, Req, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../user-plans/plan.guard";
import { ProductivityPlansService } from "./productivity-plans.service";

@Controller("productivity-plans")
@UseGuards(JwtAuthGuard, PlanGuard)
export class ProductivityPlansController {
  constructor(private readonly service: ProductivityPlansService) {}
  @Post()
  create(@Req() req: any, @Body() body: any) { req.toolId="productivity-planner"; return this.service.generate(req.user, body); }
  @Get()
  list(@Req() req: any) { return this.service.list(req.user); }
  @Get(":id")
  getOne(@Req() req: any, @Param("id") id: string) { return this.service.get(req.user, id); }
}
