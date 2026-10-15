import { Controller, Get, Put, Body } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
@Controller('gym')
export class GymController {
  @Get() async get() {
    let gym = await prisma.gym.findFirst();
    if(!gym) gym = await prisma.gym.create({ data: { name: 'TMG Business Consulting', phone: '+97470454450', email: 'tmgbusinessconsultant@gmail.com', address: 'Doha, Qatar', currency: 'USD' } });
    return gym;
  }
  @Put() async update(@Body() body: any) {
    let gym = await prisma.gym.findFirst();
    if(!gym) return this.get();
    return prisma.gym.update({ where: { id: gym.id }, data: { name: body.name, phone: body.phone, email: body.email, address: body.address, currency: 'USD' } });
  }
}
