import { Controller, Get, Post, Body } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Roles('ADMIN' as any)
@Controller('members')
export class MembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() async getAll() {
    const gym = await this.prisma.gym.findFirst();
    if(!gym) return [];
    return this.prisma.member.findMany({ where: { gymId: gym.id }, orderBy: { joinDate: 'desc' } });
  }
  @Post() async create(@Body() body: any) {
    let gym = await this.prisma.gym.findFirst();
    if(!gym) gym = await this.prisma.gym.create({ data: { name: 'TMG Business Consulting', currency: 'USD' } });
    return this.prisma.member.create({ data: { gymId: gym.id, name: body.name, phone: body.phone, email: body.email, qatarId: body.qatarId } });
  }
}
