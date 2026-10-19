import { Controller, Get, Put, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Roles(UserRole.ADMIN)
@Controller('gym')
export class GymController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() async get() {
    let gym = await this.prisma.gym.findFirst();
    if(!gym) gym = await this.prisma.gym.create({ data: { name: 'TMG Business Consulting', phone: '+97470454450', email: 'tmgbusinessconsultant@gmail.com', address: 'Doha, Qatar', currency: 'USD' } });
    return gym;
  }
  @Put() async update(@Body() body: any) {
    let gym = await this.prisma.gym.findFirst();
    if(!gym) return this.get();
    return this.prisma.gym.update({ where: { id: gym.id }, data: { name: body.name, phone: body.phone, email: body.email, address: body.address, currency: 'USD' } });
  }
}
