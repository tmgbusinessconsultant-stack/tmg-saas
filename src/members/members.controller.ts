import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
@Controller('members')
export class MembersController {
  @Get() async getAll() {
    const gym = await prisma.gym.findFirst();
    if(!gym) return [];
    return prisma.member.findMany({ where: { gymId: gym.id }, orderBy: { joinDate: 'desc' } });
  }
  @Post() async create(@Body() body: any) {
    let gym = await prisma.gym.findFirst();
    if(!gym) gym = await prisma.gym.create({ data: { name: 'TMG Business Consulting', currency: 'USD' } });
    return prisma.member.create({ data: { gymId: gym.id, name: body.name, phone: body.phone, email: body.email, qatarId: body.qatarId } });
  }
}
