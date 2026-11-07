import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { PuckContentValidationInterceptor } from './interceptors/puck-validator.interceptor';
import { CreateSiteDto, SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserSites(@CurrentUser() user: AuthenticatedUser) {
    return this.sitesService.listSites(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createSite(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSiteDto) {
    return this.sitesService.createSite(user.id, dto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  getAllSitesGlobal() {
    return this.sitesService.listAllSites();
  }

  @Get('by-subdomain/:subdomain')
  getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.sitesService.getBySubdomain(subdomain);
  }

  @Get('domain/:domain')
  getByDomain(@Param('domain') domain: string) {
    return this.sitesService.getByCustomDomain(domain);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getSiteById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sitesService.getSiteForUser(id, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateSite(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.updateSite(id, user.id, body);
  }

  @Put(':id/pages/:slug')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(PuckContentValidationInterceptor)
  @HttpCode(HttpStatus.OK)
  updatePageLayout(
    @Param('id') siteId: string,
    @Param('slug') slug: string,
    @Body() payload: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.savePageLayout(siteId, slug, payload, user.id);
  }

  @Delete(':id/pages/:slug')
  @UseGuards(JwtAuthGuard)
  deletePageSegment(
    @Param('id') siteId: string,
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.deletePage(siteId, slug, user.id);
  }

  @Post(':id/header')
  @UseGuards(JwtAuthGuard)
  updateHeaderConfiguration(
    @Param('id') siteId: string,
    @Body() body: { headerData: unknown; logoUrl?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.updateHeader(siteId, user.id, body.headerData, body.logoUrl);
  }

  @Post(':id/footer')
  @UseGuards(JwtAuthGuard)
  updateFooterConfiguration(
    @Param('id') siteId: string,
    @Body() body: { footerData: unknown },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.updateFooter(siteId, user.id, body.footerData);
  }

  @Post(':id/domain')
  @UseGuards(JwtAuthGuard)
  linkCustomDomain(
    @Param('id') siteId: string,
    @Body() body: { domain: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.addCustomDomain(siteId, user.id, body.domain);
  }

  @Post(':id/verify-domain')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  verifyDomainPropagation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sitesService.verifyDomainPropagation(id, user.id);
  }

  @Post(':id/logo-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadLogo(
    @Param('id') siteId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.uploadLogo(siteId, user.id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteSite(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sitesService.deleteSite(id, user.id);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  publishProductionRelease(@Param('id') siteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.sitesService.publish(siteId, user.id);
  }
}
