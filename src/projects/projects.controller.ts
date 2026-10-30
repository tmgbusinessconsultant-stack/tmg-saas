import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, Res, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get() @Permissions('projects:read') list(@CurrentUser() user: AuthenticatedUser) { return this.projectsService.list(user); }
  @Get('staff') @Permissions('projects:read') listStaff() { return this.projectsService.listStaff(); }
  @Post() @Permissions('projects:create') create(@CurrentUser() user: AuthenticatedUser, @Body() body: any) { return this.projectsService.create(user, body); }
  @Patch(':id/status') @Permissions('projects:update') updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { status: string }) { return this.projectsService.updateStatus(user, id, body.status); }
  @Patch(':id/assignee') @Permissions('projects:update') assign(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { assigneeId: string | null }) { return this.projectsService.assign(user, id, body.assigneeId); }
  @Patch(':id/assign') @Permissions('projects:update') assignLegacy(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { assigneeId: string | null }) { return this.projectsService.assign(user, id, body.assigneeId); }

  @Post(':id/messages') @Permissions('projects:write') sendMessage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { body: string }) { return this.projectsService.sendMessage(user, id, body.body); }
  @Delete(':id/messages/:messageId') @Permissions('projects:write') deleteMessage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('messageId') messageId: string) { return this.projectsService.deleteMessage(user, id, messageId); }

  // --- NEW: Real upload that frontend project-delivery.ts expects ---
  @Post(':id/files/upload')
  @Permissions('projects:write')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: { kind?: string },
  ) {
    return (this.projectsService as any).handleFileUpload(user, id, file, body.kind || 'CLIENT_UPLOAD');
  }

  // --- NEW: Real download with streaming ---
  @Get(':id/files/:fileId/download')
  @Permissions('projects:read')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const result = await (this.projectsService as any).handleFileDownload(user, id, fileId);
    // result contains { path, originalName, contentType }
    res.setHeader('Content-Disposition', `attachment; filename="${result.originalName}"`);
    res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
    const stream = fs.createReadStream(result.path);
    stream.pipe(res);
  }

  @Delete(':id/files/:fileId')
  @Permissions('projects:write')
  async deleteFile(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('fileId') fileId: string) {
    return this.projectsService.deleteFile(user, id, fileId);
  }

  // --- Legacy multipart kept ---
  @Post(':id/files/initiate') @Permissions('projects:write') initiateUpload(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: any) { return this.projectsService.initiateUpload(user, id, body); }
  @Post(':id/files/:fileId/presign-part') @Permissions('projects:write') presignPart(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('fileId') fileId: string, @Body() body: { partNumber: number }) { return this.projectsService.presignPart(user, id, fileId, body.partNumber); }
  @Post(':id/files/:fileId/complete') @Permissions('projects:write') completeUpload(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('fileId') fileId: string, @Body() body: { parts: any }) { return this.projectsService.completeUpload(user, id, fileId, body.parts); }
  @Get(':id/files/:fileId/scan-status') @Permissions('projects:read') scanStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('fileId') fileId: string) { return this.projectsService.scanStatus(user, id, fileId); }
  @Get(':id/files/:fileId/scan') @Permissions('projects:read') scanStatusLegacy(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('fileId') fileId: string) { return this.projectsService.scanStatus(user, id, fileId); }
}
