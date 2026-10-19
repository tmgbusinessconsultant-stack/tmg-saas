import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.gym.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id } });
    if (!gym) {
      throw new NotFoundException(`Gym ${id} was not found`);
    }
    return gym;
  }

  create(data: Prisma.GymCreateInput) {
    return this.prisma.gym.create({ data });
  }

  async update(id: string, data: Prisma.GymUpdateInput) {
    await this.findOne(id);
    return this.prisma.gym.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.gym.delete({ where: { id } });
    return { deleted: true };
  }
}
