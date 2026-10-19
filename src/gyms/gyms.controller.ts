import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { GymsService } from './gyms.service';

@Roles(UserRole.ADMIN)
@Controller('gyms')
export class GymsController {
  constructor(private readonly gyms: GymsService) {}

  @Get() findAll() { return this.gyms.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.gyms.findOne(id); }
  @Post() create(@Body() body: Prisma.GymCreateInput) { return this.gyms.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Prisma.GymUpdateInput) { return this.gyms.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.gyms.remove(id); }
}
