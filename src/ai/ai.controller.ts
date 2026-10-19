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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { AnalyzeFileDto } from './dto/analyze-file.dto';
import { FileAnalysisService } from './file-analysis.service';
import { KnowledgeService } from './knowledge.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly knowledge: KnowledgeService,
    private readonly fileAnalysis: FileAnalysisService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('chat')
  async chat(@Body() body: AskAiDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = this.ai.createSessionCookie(request.headers.cookie);
    response.setHeader('Set-Cookie', session.cookie);
    return this.ai.ask(body, session.sessionId, request.ip);
  }

  @Public()
  @Post('search-analytics')
  recordSearch(@Body() body: { query?: unknown; resultCount?: unknown }, @Req() request: Request) {
    if (typeof body?.query !== 'string' || typeof body.resultCount !== 'number') {
      return { recorded: false };
    }
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('tmg_ai_session='));
    const sessionId = cookie?.slice('tmg_ai_session='.length).split('.')[0];
    return this.ai.recordSearch(body.query, body.resultCount, sessionId, request.ip);
  }

  @Public()
  @Get('search-suggestions')
  suggestions(@Req() request: Request) {
    return this.ai.searchSuggestions(request.ip);
  }

  @Permissions('ai:manage')
  @Get('admin/analytics')
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
      paymentsReceived: paidPayments.map((item) => ({ currency: item.currency, count: item._count, amount: item._sum.amount?.toString() ?? '0' })),
    };
  }

  @Permissions('ai:manage')
  @Get('admin/conversations')
  conversations() {
    return this.ai.listConversations();
  }

  @Permissions('ai:manage')
  @Delete('admin/conversations/:id')
  deleteConversation(@Param('id') id: string) {
    return this.ai.deleteConversation(id);
  }

  @Permissions('ai:manage')
  @Get('admin/knowledge')
  listKnowledge() {
    return this.knowledge.list();
  }

  @Permissions('ai:manage')
  @Post('admin/knowledge')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadKnowledge(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    return this.knowledge.upload(file, user);
  }

  @Permissions('ai:manage')
  @Post('admin/knowledge/:id/scan')
  refreshKnowledgeScan(@Param('id') id: string) {
    return this.knowledge.refreshScan(id);
  }

  @Permissions('ai:manage')
  @Delete('admin/knowledge/:id')
  deleteKnowledge(@Param('id') id: string) {
    return this.knowledge.delete(id);
  }

  @Permissions('projects:manage')
  @Post('admin/projects/:projectId/files/:fileId/analyze')
  analyzeFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: AnalyzeFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fileAnalysis.analyze(projectId, fileId, user, body.confirmExternalProcessing);
  }

  @Permissions('projects:manage')
  @Get('admin/projects/:projectId/files/:fileId/analysis')
  latestFileAnalysis(@Param('projectId') projectId: string, @Param('fileId') fileId: string) {
    return this.fileAnalysis.latest(projectId, fileId);
  }
}
