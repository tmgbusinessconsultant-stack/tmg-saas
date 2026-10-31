import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sites')
export class SitesController {
  constructor(private sites: SitesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.sites.createSite(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  listAllAdmin(@Req() req: any) {
    return this.sites.listAllSites();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.sites.listSites(req.user.id);
  }

  @Get('by-subdomain/:subdomain')
  getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.sites.getSiteBySubdomain(subdomain);
  }

  @Get('domain/:domain')
  getByDomain(@Param('domain') domain: string) {
    return this.sites.getSiteByDomain(domain);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.sites.getSite(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/pages/:slug')
  updatePage(@Param('id') id: string, @Param('slug') slug: string, @Body() body: any) {
    return this.sites.savePageLayout(id, slug, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/pages/:slug')
  deletePage(@Param('id') id: string, @Param('slug') slug: string) {
    return this.sites.deletePage(id, slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/domain')
  addCustomDomain(@Param('id') id: string, @Body() body: { domain: string }, @Req() req: any) {
    return this.sites.addCustomDomain(id, req.user.id, body.domain);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/header')
  updateHeader(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.sites.updateHeader(id, req.user.id, body.headerData, body.logoUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/footer')
  updateFooter(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.sites.updateFooter(id, req.user.id, body.footerData);
  }

  // === STEP 4: LOGO FILE UPLOAD ===
  @UseGuards(JwtAuthGuard)
  @Post(':id/logo-upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|svg\+xml|svg)$/)) {
        return cb(new Error('Only image files allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const url = `/uploads/logos/${file.filename}`;
    await this.sites.updateHeader(id, req.user.id, null, url);
    return { url, fileUrl: `http://localhost:4000${url}`, filename: file.filename };
  }

    @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteSite(@Param('id') id: string, @Req() req: any) {
    return this.sites.deleteSite(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.sites.publish(id);
  }
}



