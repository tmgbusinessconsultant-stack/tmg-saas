import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Establishes a connection to Neon Serverless PostgreSQL with SSL mapping verification
    await this.$connect();
  }

  async onModuleDestroy() {
    // Gracefully cuts connections on environment teardown to prevent hanging queries
    await this.$disconnect();
  }
}
