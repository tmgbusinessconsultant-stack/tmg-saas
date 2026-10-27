import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards, Req, Query } from '@nestjs/common';
import { PlanGuard } from '../user-plans/plan.guard';
import { CvDocumentsService } from './cv-documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard'; // Imported your advanced RBAC/PBAC validator guard
import { Roles } from '../auth/roles.decorator'; // Custom structural metadata reflector decorator
import { Permissions } from '../auth/permissions.decorator'; // Custom fine-grained capability reflector decorator
import { Response } from 'express';

@Controller('cv-documents')
// Grounding Guard Strategy: Jwt verifies session, Plan enforces subscription tools, Roles checks permissions
@UseGuards(JwtAuthGuard, PlanGuard, RolesGuard)
export class CvDocumentsController {
  constructor(private readonly documents: CvDocumentsService) { }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.documents.generate(req.user, body);
  }

  @Get()
  async list(@Req() req: any) {
    return this.documents.list(req.user);
  }

  /**
   * CRITICAL SECURITY BOUNDARY: Locked to administrative roles only
   */
  @Get('all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('documents:read_all')
  async listAll() {
    return this.documents.listAll();
  }

  @Get('file/:id')
  async getFileLegacy(@Req() req: any, @Param('id') id: string, @Query('download') download: string, @Res() res: Response) {
    return this.handleFileStreaming(req, id, download, res);
  }

  @Get(':id/file')
  async getFile(@Req() req: any, @Param('id') id: string, @Query('download') download: string, @Res() res: Response) {
    return this.handleFileStreaming(req, id, download, res);
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.documents.get(req.user, id);
  }

  /**
   * CRITICAL SECURITY BOUNDARY: Paid monetization adjustment must be restricted to management
   */
  @Post(':id/download-control')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('documents:write_control')
  async setDownloadControl(@Param('id') id: string, @Body() body: any) {
    return this.documents.setDownloadControl(id, body);
  }

  /**
   * CRITICAL SECURITY BOUNDARY: Restricts discretionary billing overrides from general public vectors
   */
  @Post(':id/grant-access')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('documents:grant_free')
  async grantFreeAccess(@Param('id') id: string, @Body() body: any) {
    return this.documents.grantFreeAccess(id, body.userId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.documents.remove(req.user, id);
  }

  private async handleFileStreaming(req: any, id: string, download: string, res: Response) {
    const result = await this.documents.getFileBuffer(id, req.user);
    const wantDownload = download === 'true' || download === '1';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('Content-Disposition', `${wantDownload ? 'attachment' : 'inline'}; filename="${result.doc.title || 'Executive-CV'}.pdf"`);

    return res.send(result.buffer);
  }
}
