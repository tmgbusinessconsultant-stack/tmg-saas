import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CvDocumentsService } from './cv-documents.service';

@Controller('cv-documents')
export class CvDocumentsController {
  constructor(private readonly documents: CvDocumentsService) {}

  @Post()
  generate(@CurrentUser() user: AuthenticatedUser, @Body() body: { name?: unknown; role?: unknown; experience?: unknown }) {
    return this.documents.generate(user, body ?? {});
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.documents.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documents.get(user, id);
  }
}
