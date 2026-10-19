import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Roles(UserRole.ADMIN)
@Controller('plans')
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() async findAll() {
    return this.prisma.membershipPlan.findMany();
  }

  @Post() async create(@Body() body: any) {
    let gym = await this.prisma.gym.findFirst();
    if (!gym) gym = await this.prisma.gym.create({ data: { name: 'TMG Business Consulting', currency: 'USD' } });

    return this.prisma.membershipPlan.create({
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
    return this.prisma.membershipPlan.delete({ where: { id } });
  }
}