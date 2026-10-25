import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards, Req, Query } from '@nestjs/common';
import { PlanGuard } from '../user-plans/plan.guard';
import { CvDocumentsService } from './cv-documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('cv-documents')
@UseGuards(JwtAuthGuard, PlanGuard)
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

  @Get('all')
  async listAll() {
    return this.documents.listAll();
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.documents.get(req.user, id);
  }

  @Get(':id/file')
  async getFile(@Req() req: any, @Param('id') id: string, @Query('download') download: string, @Res() res: Response) {
    const wantDownload = download === 'true' || download === '1';
    const result = await this.documents.getFilePath(id, req.user, wantDownload);
    // S3 mode - redirect to signed URL
    if ((result as any).fileUrl) {
      return res.redirect((result as any).fileUrl);
    }
    // fallback if still local (should not happen now)
    return res.status(404).json({ message: 'File URL not available' });
  }

  @Post(':id/download-control')
  async setDownloadControl(@Param('id') id: string, @Body() body: any) {
    return this.documents.setDownloadControl(id, body);
  }

  @Post(':id/grant-access')
  async grantFreeAccess(@Param('id') id: string, @Body() body: any) {
    return this.documents.grantFreeAccess(id, body.userId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.documents.remove(req.user, id);
  }
}