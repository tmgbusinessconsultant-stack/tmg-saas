import { Injectable } from '@nestjs/common';
@Injectable()
export class GymsService {
  findAll() { return []; }
  findOne(id: string) { return null; }
  findBySlug(slug: string) { return null; }
  create(dto: any) { return dto; }
  update(id: string, dto: any) { return dto; }
  remove(id: string) { return { deleted: true }; }
}
