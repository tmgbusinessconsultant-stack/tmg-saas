import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { serviceType: string; title: string; description: string },
  ) {
    return this.projects.create(user, body);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.projects.list(user);
  }

  @Get('staff')
  @Permissions('projects:manage')
  listStaff() {
    return this.projects.listStaff();
  }

  @Patch(':projectId/status')
  @Permissions('projects:manage')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: { status: string },
  ) {
    return this.projects.updateStatus(user, projectId, body?.status);
  }

  @Patch(':projectId/assignee')
  @Permissions('projects:manage')
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: { assigneeId: string | null },
  ) {
    return this.projects.assign(user, projectId, body?.assigneeId);
  }

  @Post(':projectId/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: { body: string },
  ) {
    return this.projects.sendMessage(user, projectId, body?.body);
  }

  @Post(':projectId/files')
  initiateUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: { name?: string; contentType?: string; size?: number; kind?: string },
  ) {
    return this.projects.initiateUpload(user, projectId, body ?? {});
  }

  @Post(':projectId/files/:fileId/parts/:partNumber')
  presignPart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Param('partNumber', ParseIntPipe) partNumber: number,
  ) {
    return this.projects.presignPart(user, projectId, fileId, partNumber);
  }

  @Post(':projectId/files/:fileId/complete')
  completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: { parts: Array<{ partNumber: number; etag: string }> },
  ) {
    return this.projects.completeUpload(user, projectId, fileId, body?.parts);
  }

  @Post(':projectId/files/:fileId/abort')
  abortUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projects.abortUpload(user, projectId, fileId);
  }

  @Get(':projectId/files/:fileId/scan-status')
  scanStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projects.scanStatus(user, projectId, fileId);
  }

  @Get(':projectId/files/:fileId/download')
  download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projects.download(user, projectId, fileId);
  }
}
