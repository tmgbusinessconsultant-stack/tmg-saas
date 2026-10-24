import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { UserPlansService } from "../user-plans/user-plans.service";

@Injectable()
export class RiskAssessmentsService {
  constructor(private prisma: PrismaService, private ai: AiService, private userPlans: UserPlansService) {}

  async generate(user: any, dto: any) {
    const userId = user.id || user.sub;
    await this.userPlans.checkToolAccess(userId, "risk-assessment");

    const countryLawMap: any = {
      Qatar: "Qatar Labour Law 14/2004 + QFC + MoCI",
      UAE: "UAE Labour Law + MOHRE",
      "Saudi Arabia": "Saudi Labour Law + MISA",
      UK: "Employment Rights Act 1996 + UKVI",
      USA: "FLSA + OSHA + State Compliance",
      Australia: "Fair Work Act 2009 + ASIC",
    };

    const prompt = `
      INTERNATIONAL RISK ASSESSMENT - Professional Level
      Business: ${dto.businessType} | Industry: ${dto.industry}
      Location: ${dto.location}, ${dto.country} | Currency: ${dto.currency||"QAR"}
      Investment: ${dto.investmentAmount} | Team: ${dto.teamSize}
      Concerns: ${dto.concerns}
      Law Context: ${countryLawMap[dto.country]||"International Compliance"}

      Generate JSON with:
      {
        "riskMatrix": [{"risk":"...", "category":"Operational|Financial|Legal|Market|Compliance", "likelihood":1-5, "impact":1-5, "score": "...", "mitigation":"..."} x 8-10],
        "overallScore": "Low|Medium|High",
        "goNoGo": "Go | Go with Mitigation | No-Go",
        "executiveSummary": "..."
      }
      Advanced, international, Qatar-first if Qatar.
    `;

    const aiResult = await this.ai.ask({ message: prompt, context: "risk-assessment" } as any, userId, "127.0.0.1");
    
    const saved = await this.prisma.riskAssessment.create({
      data: {
        userId,
        businessType: dto.businessType,
        industry: dto.industry,
        location: dto.location,
        country: dto.country||"Qatar",
        currency: dto.currency||"QAR",
        investmentAmount: dto.investmentAmount,
        teamSize: dto.teamSize,
        concerns: dto.concerns,
        riskMatrix: (aiResult as any) || {},
        overallScore: (aiResult as any)?.overallScore || "Medium",
        recommendations: (aiResult as any) || {},
      }
    });

    await this.userPlans.incrementUsage(userId);
    return saved;
  }

  list(user: any) { return this.prisma.riskAssessment.findMany({ where: { userId: user.id||user.sub }, orderBy: { createdAt: "desc" } }); }
  get(user: any, id: string) { return this.prisma.riskAssessment.findFirst({ where: { id, userId: user.id||user.sub } }); }
}
