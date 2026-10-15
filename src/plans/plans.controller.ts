import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

@Controller('plans')
export class PlansController {
  @Get() async findAll() {
    return prisma.membershipPlan.findMany();
  }

  @Post() async create(@Body() body: any) {
    let gym = await prisma.gym.findFirst();
    if (!gym) gym = await prisma.gym.create({ data: { name: 'TMG Business Consulting', currency: 'USD' } });

    return prisma.membershipPlan.create({
      data: {
        name: body.name,
        price: Number(body.price),
        duration: parseInt(body.durationDays || body.duration || '30'),
        type: body.type || 'MONTHLY',
        description: body.description || '',
        gym: { connect: { id: gym.id } }
      }
    });
  }

  @Delete(':id') async delete(@Param('id') id: string) {
    return prisma.membershipPlan.delete({ where: { id } });
  }
}