import { Injectable } from '@nestjs/common';
@Injectable()
export class AuthService {
  async register(dto: any) { return { message: 'Use /gym endpoints - TMG Business Consulting', dto }; }
  async login(dto: any) { return { token: 'tmg-token', user: { name: 'TMG Admin' } }; }
}
