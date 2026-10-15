import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'ok',
      message: 'TMG SAAS Backend is LIVE on Vercel!',
      timestamp: new Date().toISOString(),
    };
  }
}