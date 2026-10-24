import { Controller, Get, Post, Param, Body, Query, Res, Req, Patch, SetMetadata } from '@nestjs/common';
import { BusinessPlansService } from './business-plans.service';
import { Response } from 'express';

// Make all routes public for now to avoid Unauthorized - you can add auth later
export const Public = () => SetMetadata('isPublic', true);

@Controller('business-plans')
export class BusinessPlansController {
  constructor(private readonly plans: BusinessPlansService) {}

  @Public()
  @Post()
  generate(@Req() req: any, @Body() body: any) {
    const user = req.user || { id: 'dev-user-'+Date.now() };
    console.log('Generating plan for:', body.title, 'Currency:', body.financials);
    return this.plans.generate(user, body ?? {});
  }

  @Public()
  @Get()
  list(@Req() req: any) {
    const user = req.user || { id: 'dev-user' };
    return this.plans.list(user);
  }

  @Public()
  @Get('admin/all')
  listAll() { return this.plans.listAll(); }

  @Public()
  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    const user = req.user || { id: 'dev-user' };
    return this.plans.get(user, id);
  }

  @Public()
  @Get('file/:id')
  async getFile(@Param('id') id: string, @Req() req: any, @Query('download') download: string, @Res() res: Response) {
    const user = req.user || { id: 'dev-user' };
    const wantDownload = download === 'true';
    console.log('Generating PDF for plan:', id, 'wantDownload:', wantDownload);
    const result = await this.plans.getFilePath(id, user, wantDownload);
    const buffer = (result as any).buffer || result;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': (wantDownload ? 'attachment' : 'inline') + '; filename="TMG-Business-Plan-'+id+'.pdf"', 'Content-Length': (buffer as Buffer).length });
    res.end(buffer);
  }

  @Public()
  @Patch(':id/download-control')
  setDownloadControl(@Param('id') id: string, @Body() body: any) { return this.plans.setDownloadControl(id, body); }
}
