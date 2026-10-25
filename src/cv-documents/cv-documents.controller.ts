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
  async create(@Req() req: any, @Body() body: any) { return this.documents.generate(req.user, body); }
  @Get()
  async list(@Req() req: any) { return this.documents.list(req.user); }
  @Get('all')
  async listAll() { return this.documents.listAll(); }
  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) { return this.documents.get(req.user, id); }

  @Get(':id/file')
  async getFile(@Req() req: any, @Param('id') id: string, @Query('download') download: string, @Res() res: Response) {
    const result = await this.documents.getFileBuffer(id, req.user);
    const wantDownload = download === 'true' || download === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('Content-Disposition', `${wantDownload ? 'attachment' : 'inline'}; filename="${result.doc.title}.pdf"`);
    res.send(result.buffer);
  }

  @Post(':id/download-control')
  async setDownloadControl(@Param('id') id: string, @Body() body: any) { return this.documents.setDownloadControl(id, body); }
  @Post(':id/grant-access')
  async grantFreeAccess(@Param('id') id: string, @Body() body: any) { return this.documents.grantFreeAccess(id, body.userId); }
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) { return this.documents.remove(req.user, id); }
}