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

  /**
   * Omni-Agent Multi-Engine Chat Pipeline
   * Route: POST /api/ai/chat
   */
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

      // Routes directly into your dynamic multi-engine orchestrator
      return await this.ai.ask(body, session.sessionId, request.ip);
    } catch (error: any) {
      this.logger.error(`Core execution fault inside edge chat router: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI pipeline processing error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search Engine Query Analytics Recorder
   * Route: POST /api/ai/search-analytics
   */
  @Public()
  @Post('search-analytics')
  @HttpCode(HttpStatus.OK)
  async recordSearch(
    @Body() body: { query?: unknown; resultCount?: unknown },
    @Req() request: Request,
  ) {
    if (typeof body?.query !== 'string' || typeof body.resultCount !== 'number') {
      return { recorded: false };
    }

    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('tmg_ai_session='));

    const sessionId = cookie?.slice('tmg_ai_session='.length).split('.')[0];

    // Explicitly aligned to match the updated numeric type footprint
    return await this.ai.recordSearch(body.query, body.resultCount, sessionId, request.ip);
  }

  /**
   * Search Suggestion Generation Vector
   * Route: GET /api/ai/search-suggestions
   */
  @Public()
  @Get('search-suggestions')
  @HttpCode(HttpStatus.OK)
  async suggestions(@Req() request: Request) {
    return await this.ai.searchSuggestions(request.ip);
  }

  /**
   * Enterprise Analytics Dashboard Aggregator
   * Route: GET /api/ai/admin/analytics
   */
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/analytics')
  @HttpCode(HttpStatus.OK)
  async analytics() {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [search, assistant, activeAiSessions, quotes, acceptedQuotes, paidPayments, completedProjects] = await Promise.all([
      this.ai.searchAnalytics(),
      this.prisma.aiConversation.count({ where: { createdAt: { gte: since } } }),
      this.prisma.aiConversation.findMany({
        where: { createdAt: { gte: since } },
        distinct: ['sessionId'],
        select: { sessionId: true },
      }),
      this.prisma.quoteRequest.count({ where: { createdAt: { gte: since } } }),
      this.prisma.quoteRequest.count({ where: { createdAt: { gte: since }, status: 'ACCEPTED' } }),
      this.prisma.payment.groupBy({
        by: ['currency'],
        where: { status: 'COMPLETED', completedAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.project.count({ where: { status: 'COMPLETED', updatedAt: { gte: since } } }),
    ]);

    return {
      periodDays: 90,
      search,
      aiQuestions: assistant,
      activeAiSessions: activeAiSessions.length,
      quoteRequests: quotes,
      acceptedQuotes,
      completedProjects,
      paymentsReceived: paidPayments.map((item) => ({
        currency: item.currency,
        count: item._count,
        amount: item._sum.amount?.toString() ?? '0',
      })),
    };
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/conversations')
  async conversations() {
    return await this.ai.listConversations();
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Delete('admin/conversations/:id')
  async deleteConversation(@Param('id') id: string) {
    return await this.ai.deleteConversation(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Get('admin/knowledge')
  async listKnowledge() {
    return await this.knowledge.list();
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Post('admin/knowledge')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadKnowledge(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    return await this.knowledge.upload(file, user);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Post('admin/knowledge/:id/scan')
  async refreshKnowledgeScan(@Param('id') id: string) {
    return await this.knowledge.refreshScan(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('ai:manage')
  @Delete('admin/knowledge/:id')
  async deleteKnowledge(@Param('id') id: string) {
    return await this.knowledge.delete(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('projects:manage')
  @Post('admin/projects/:projectId/files/:fileId/analyze')
  async analyzeFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: AnalyzeFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.fileAnalysis.analyze(projectId, fileId, user, body.confirmExternalProcessing);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('projects:manage')
  @Get('admin/projects/:projectId/files/:fileId/analysis')
  async latestFileAnalysis(@Param('projectId') projectId: string, @Param('fileId') fileId: string) {
    return await this.fileAnalysis.latest(projectId, fileId);
  }
}
