import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get('blog')
  listPublishedPosts() {
    return this.content.listPublishedPosts();
  }

  @Public()
  @Get('blog/:slug')
  getPublishedPost(@Param('slug') slug: string) {
    return this.content.getPublishedPost(slug);
  }

  @Public()
  @Get('gallery')
  listGallery() {
    return this.content.listGallery();
  }

  @Public()
  @Get('content/media')
  listPublishedMedia(@Query('location') location: string) {
    return this.content.listPublishedMedia(location);
  }

  @Public()
  @Get('content/media/:id/file')
  async publishedMedia(@Param('id') id: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const result = await this.content.getPublishedMedia(id);
    response.set({
      'Content-Type': result.contentType,
      'Content-Length': result.body.byteLength,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      ...(result.contentType === 'image/svg+xml' ? { 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'" } : {}),
    });
    return new StreamableFile(result.body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/media')
  listMedia(@Query('search') search?: string, @Query('type') type?: string) {
    return this.content.listMedia(search, type);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/media/:id/preview')
  async previewAdminMedia(@Param('id') id: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const result = await this.content.getAdminMediaPreview(id);
    response.set({
      'Content-Type': result.contentType,
      'Content-Length': result.body.byteLength,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(result.contentType === 'image/svg+xml' ? { 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'" } : {}),
    });
    return new StreamableFile(result.body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/content/media')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  uploadMedia(@UploadedFile() file: Express.Multer.File, @Body('location') location: string, @CurrentUser() user: AuthenticatedUser) {
    return this.content.uploadMedia(file, location, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put('admin/content/media/:id/file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  replaceMedia(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    return this.content.replaceMedia(id, file, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admin/content/media/:id')
  updateMedia(@Param('id') id: string, @Body() body: { locations?: string[] }, @CurrentUser() user: AuthenticatedUser) {
    return this.content.updateMedia(id, body?.locations, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/content/media/:id/scan')
  scanMedia(@Param('id') id: string) {
    return this.content.refreshMediaScan(id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admin/content/media/:id')
  deleteMedia(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.content.deleteMedia(id, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/categories')
  listCategories() {
    return this.content.listCategories();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/content/categories')
  createCategory(@Body() body: { name?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.content.createCategory(body?.name, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admin/content/categories/:id')
  deleteCategory(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.content.deleteCategory(id, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/blog')
  listAdminPosts() {
    return this.content.listAdminPosts();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/content/blog')
  createPost(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.content.savePost(undefined, body, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put('admin/content/blog/:id')
  updatePost(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.content.savePost(id, body, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admin/content/blog/:id')
  deletePost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.content.deletePost(id, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/gallery')
  listAdminGallery() {
    return this.content.listAdminGallery();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/content/gallery')
  createGalleryItem(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.content.saveGalleryItem(undefined, body, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put('admin/content/gallery/:id')
  updateGalleryItem(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.content.saveGalleryItem(id, body, user);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admin/content/gallery/:id')
  deleteGalleryItem(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.content.deleteGalleryItem(id, user);
  }

  @Public()
  @Get('content/homepage')
  getHomepage() {
    return this.content.getPublicHomepage();
  }

  @Public()
  @Get('content/seo')
  getPublicSeoSettings() {
    return this.content.getSetting('seo');
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin/content/settings/:key')
  getAdminSetting(@Param('key') key: string) {
    return this.content.getSetting(key);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put('admin/content/settings/:key')
  saveSetting(@Param('key') key: string, @Body('value') value: unknown, @CurrentUser() user: AuthenticatedUser) {
    return this.content.saveSetting(key, value, user);
  }
}
