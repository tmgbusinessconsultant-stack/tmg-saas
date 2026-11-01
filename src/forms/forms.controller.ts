import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CreateFormDto, UpdateFormDto } from './dto/create-form.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';

@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sites/:id/forms')
  create(
    @Param('id') siteId: string,
    @Body() dto: CreateFormDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.formsService.create(siteId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sites/:id/forms')
  findBySite(@Param('id') siteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.formsService.findBySite(siteId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('forms/:formId')
  update(
    @Param('formId') formId: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.formsService.update(formId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('forms/:formId')
  remove(@Param('formId') formId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.formsService.remove(formId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('forms/:formId/submissions')
  getSubs(@Param('formId') formId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.formsService.getSubmissions(formId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sites/:id/submissions')
  getSiteSubs(@Param('id') siteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.formsService.getSubmissionsBySite(siteId, user);
  }

  @Public()
  @Post('forms/:formId/submit')
  submit(@Param('formId') formId: string, @Body() body: any) {
    return this.formsService.submit(formId, body.data || body);
  }

  @Public()
  @Get('forms/:formId')
  findOnePublic(@Param('formId') formId: string) {
    return this.formsService.findOne(formId);
  }
}
