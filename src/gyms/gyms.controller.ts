import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { GymsService } from './gyms.service';
@Controller('gyms')
export class GymsController {
  constructor(private gyms: GymsService) {}
  @Get() findAll() { return this.gyms.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.gyms.findOne(id); }
  @Post() create(@Body() body: any) { return this.gyms.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.gyms.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.gyms.remove(id); }
}
