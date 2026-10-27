import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { UserPlansService } from "../user-plans/user-plans.service";

@Injectable()
export class ProductivityPlansService {
  constructor(private prisma: PrismaService, private ai: AiService, private userPlans: UserPlansService) {}

  async generate(user: any, dto: any) {
    const userId = user.id||user.sub;
    await this.userPlans.checkToolAccess(userId, "productivity-planner");

    const isQatar = dto.country==="Qatar";
    const workWeek = dto.workSchedule.includes("Sun-Thu") ? "Sunday to Thursday (Qatar)" : "Monday to Friday (International)";
    const prayerAware = isQatar ? "Include Fajr/Dhuhr/Asr breaks, Ramadan reduced hours option" : "Include local breaks";

    const prompt = `
      INTERNATIONAL PRODUCTIVITY PLANNER - Advanced Professional
      Role: ${dto.role} | Team: ${dto.teamSize} | Schedule: ${dto.workSchedule} (${workWeek})
      Country: ${dto.country} | Goals: ${dto.goals} | Challenges: ${dto.challenges}
      Context: ${prayerAware}, Focus time blocking, GCC + Global best practices.

      Generate JSON:
      {
        "weeklyPlan": {"Sunday|Monday": [{"time":"08:00-10:00","task":"...","type":"Deep Work|Meeting|Break"} x 6] x 5-6 days},
        "kpis": {"focusHours": "...", "meetingsLimit": "...", "tasksPerDay": "..."},
        "optimizationTips": ["..."]
      }
    `;

    const aiResult = await this.ai.ask({ message: prompt, context: "productivity-planner" } as any, userId, "127.0.0.1");

    const saved = await this.prisma.productivity_plans.create({
      data: {
        userId,
        role: dto.role,
        teamSize: dto.teamSize,
        workSchedule: dto.workSchedule,
        country: dto.country,
        goals: dto.goals,
        challenges: dto.challenges,
        weeklyPlan: (aiResult as any)?.weeklyPlan || aiResult,
        kpis: (aiResult as any)?.kpis || {},
      }
    });

    await this.userPlans.incrementUsage(userId);
    return saved;
  }

  list(user: any) { return this.prisma.productivity_plans.findMany({ where: { userId: user.id||user.sub }, orderBy: { createdAt: "desc" } }); }
  get(user: any, id: string) { return this.prisma.productivity_plans.findFirst({ where: { id, userId: user.id||user.sub } }); }
}

