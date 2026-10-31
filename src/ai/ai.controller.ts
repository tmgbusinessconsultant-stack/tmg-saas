import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, AdvancedAgentResult } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { AnalyzeFileDto } from './dto/analyze-file.dto';
import { FileAnalysisService } from './file-analysis.service';
import { KnowledgeService } from './knowledge.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ai: AiService,
    private readonly knowledge: KnowledgeService,
    private readonly fileAnalysis: FileAnalysisService,
    private readonly prisma: PrismaService,
  ) { }

  @Public()
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: AskAiDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdvancedAgentResult> {
    try {
      const session = this.ai.createSessionCookie(request.headers.cookie);
      response.setHeader('Set-Cookie', session.cookie);
      return await this.ai.ask(body, session.sessionId, request.ip);
    } catch (error: any) {
      this.logger.error(`Core execution fault: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI pipeline error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * === UPGRADE BEST — TMG BUILDER AI ===
   * Route: POST /api/ai/generate-layout
   * Uses AiService.generateLayout() — Qatar optimized, schemaVersion 2
   * Returns: { blocks, content, heading, features } — compatible with builder v2
   */
  @Post('generate-layout')
  @HttpCode(HttpStatus.OK)
  async generateLayout(@Body() body: any) {
    const { companyName, industry, tone, targetAudience, componentType, prompt, siteId } = body;

    if (!companyName) {
      throw new HttpException('companyName required', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.log(`AI Layout Request: ${companyName} | ${industry} | ${componentType}`);

      // UPGRADED: Use the BEST engine from AiService
      const result = await this.ai.generateLayout({
        companyName,
        industry: industry || 'Corporate Consulting',
        tone: tone || 'Professional',
        componentType: componentType || 'hero',
        prompt: prompt || '',
        targetAudience: targetAudience || 'Business owners in Qatar',
        siteId
      });

      // BEST response — includes blocks + content + seo helpers
      return {
        ...result,
        seoTitle: `${companyName} | Best ${industry || 'Business'} in Qatar`,
        seoDesc: result.subtext || result.description || `Leading ${industry} solutions in Qatar`,
        schemaVersion: 2,
        generatedAt: new Date().toISOString(),
        engine: 'V7-OMNI-BUILDER-BEST'
      };

    } catch (error: any) {
      this.logger.error(`AI layout generation failed: ${error.message}`, error.stack);

      // ULTIMATE FALLBACK — Never crashes builder — returns valid Puck blocks
      const fallbackFeatures = [
        { title: `Expert ${body.industry || 'Corporate Consulting'}`, desc: `${body.tone || 'Professional'} consulting tailored for Qatar market`, icon: "🏢" },
        { title: "Qatar Compliant", desc: "100% MOCI, MOF, Ministry compliant setup", icon: "📑" },
        { title: "Dedicated Support", desc: "Local team in Doha — 24/7 business support", icon: "🚀" }
      ];

      if (body.componentType === 'hero') {
        return {
          heading: `${body.companyName} - Leading ${body.industry || 'Business'} Excellence in Qatar`,
          title: `${body.companyName} - Leading ${body.industry || 'Business'} Excellence`,
          subtext: `We empower businesses in Qatar with ${body.tone || 'professional'} ${body.industry || 'business'} solutions tailored for growth and compliance.`,
          ctaText: `Partner with ${body.companyName}`,
          blocks: [{ type: "Hero", props: { id: `hero_fb_${Date.now()}`, title: `${body.companyName} - Leading ${body.industry} Excellence in Qatar`, subtitle: `Professional ${body.industry} solutions in Doha`, ctaText: "Get Started", bg: "#0a2540" } }],
          content: [{ type: "Hero", props: { id: `hero_fb_${Date.now()}`, title: `${body.companyName}`, subtitle: `Leading ${body.industry}`, ctaText: "Get Started" } }],
          seoTitle: `${body.companyName} | Best ${body.industry} in Qatar`,
          seoDesc: `Leading ${body.industry} in Qatar`,
          schemaVersion: 2,
          engine: 'FALLBACK-TEMPLATE-BEST'
        };
      } else {
        return {
          features: fallbackFeatures,
          items: fallbackFeatures,
          blocks: [{ type: "CardGrid", props: { id: `feat_fb_${Date.now()}`, title: `Why Choose ${body.companyName}`, itemsJson: JSON.stringify(fallbackFeatures, null, 2) } }],
          content: [{ type: "CardGrid", props: { id: `feat_fb_${Date.now()}`, title: `Why Choose ${body.companyName}`, itemsJson: JSON.stringify(fallbackFeatures, null, 2) } }],
          seoTitle: `${body.companyName} Services | Qatar`,
          seoDesc: `${body.industry} services in Doha`,
          schemaVersion: 2,
          engine: 'FALLBACK-TEMPLATE-BEST'
        };
      }
    }
  }

  // === UPGRADE: AI SITE SCAFFOLD FOR /sites PAGE ===
  @Post('generate-site')
  @HttpCode(HttpStatus.OK)
  async generateSite(@Body() body: { name: string; industry?: string; tone?: string; description?: string }) {
    if (!body.name) throw new HttpException('name required', HttpStatus.BAD_REQUEST);
    try {
      return await this.ai.generateSiteScaffold(body);
    } catch (e: any) {
      this.logger.error(`generate-site failed: ${e.message}`);
      return {
        name: body.name,
        seoTitle: `${body.name} | Qatar`,
        seoDesc: body.description || `Best ${body.industry} in Qatar`,
        schemaVersion: 2,
        settings: { aiGenerated: true, industry: body.industry, tone: body.tone },
        initialBlocks: []
      };
    }
  }

  @Public()
  @Post('search-analytics')
  @HttpCode(HttpStatus.OK)
  async recordSearch(@Body() body: { query?: unknown; resultCount?: unknown }, @Req() request: Request) {
    if (typeof body?.query !== 'string' || typeof body.resultCount !== 'number') return { recorded: false };
    const cookie = request.headers.cookie?.split(';').map(p => p.trim()).find(p => p.startsWith('tmg_ai_session='));
    const sessionId = cookie?.slice('tmg_ai_session='.length).split('.')[0];
    return await this.ai.recordSearch(body.query, body.resultCount, sessionId, request.ip);
  }

  @Public()
  @Get('search-suggestions')
  @HttpCode(HttpStatus.OK)
  async suggestions(@Req() request: Request) {
    return await this.ai.searchSuggestions(request.ip);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/analytics')
  @HttpCode(HttpStatus.OK)
  async analytics() {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [search, assistant, activeAiSessions, quotes, acceptedQuotes, paidPayments, completedProjects] = await Promise.all([
      this.ai.searchAnalytics(),
      this.prisma.aiConversation.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiConversation.findMany({ where: { createdAt: { gte: since } }, distinct: ['sessionId'], select: { sessionId: true } }),
      this.prisma.quoteRequest.count({ where: { createdAt: { gte: since } } }),
      this.prisma.quoteRequest.count({ where: { createdAt: { gte: since }, status: 'ACCEPTED' } }),
      this.prisma.payment.groupBy({ by: ['currency'], where: { status: 'COMPLETED', completedAt: { gte: since } }, _sum: { amount: true }, _count: true }),
      this.prisma.project.count({ where: { status: 'COMPLETED', updatedAt: { gte: since } } }),
    ]);
    return { periodDays: 90, search, aiQuestions: assistant, activeAiSessions: activeAiSessions.length, quoteRequests: quotes, acceptedQuotes, completedProjects, paymentsReceived: paidPayments.map(item => ({ currency: item.currency, count: item._count, amount: item._sum.amount?.toString() ?? '0' })) };
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/conversations')
  async conversations() { return await this.ai.listConversations(); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Delete('admin/conversations/:id')
  async deleteConversation(@Param('id') id: string) { return await this.ai.deleteConversation(id); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/knowledge')
  async listKnowledge() { return await this.knowledge.list(); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Post('admin/knowledge')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadKnowledge(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) { return await this.knowledge.upload(file, user); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Post('admin/knowledge/:id/scan')
  async refreshKnowledgeScan(@Param('id') id: string) { return await this.knowledge.refreshScan(id); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Delete('admin/knowledge/:id')
  async deleteKnowledge(@Param('id') id: string) { return await this.knowledge.delete(id); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('projects:manage')
  @Post('admin/projects/:projectId/files/:fileId/analyze')
  async analyzeFile(@Param('projectId') projectId: string, @Param('fileId') fileId: string, @Body() body: AnalyzeFileDto, @CurrentUser() user: AuthenticatedUser) { return await this.fileAnalysis.analyze(projectId, fileId, user, body.confirmExternalProcessing); }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('projects:mADanage')
  @Get('admin/projects/:projectId/files/:fileId/analysis')
  async latestFileAnalysis(@Param('projectId') projectId: string, @Param('fileId') fileId: string) { return await this.fileAnalysis.latest(projectId, fileId); }
}