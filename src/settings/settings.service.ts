import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

const UPLOAD_LIMIT_SETTING = 'projectUploadLimitMb';
const DEFAULT_UPLOAD_LIMIT_MB = 100;
const MAX_UPLOAD_LIMIT_MB = 2048;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectUploadLimit() {
    const setting = await this.prisma.cmsSetting.findUnique({
      where: { key: UPLOAD_LIMIT_SETTING },
      select: { value: true },
    });
    const maximumMegabytes = setting
      ? this.parseConfiguredLimit(setting.value)
      : this.environmentDefault();
    return { maximumMegabytes };
  }

  async updateProjectUploadLimit(user: AuthenticatedUser, maximumMegabytes: number) {
    if (!Number.isInteger(maximumMegabytes) || maximumMegabytes < 1 || maximumMegabytes > MAX_UPLOAD_LIMIT_MB) {
      throw new BadRequestException(`Upload limit must be a whole number between 1 and ${MAX_UPLOAD_LIMIT_MB} MB.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.cmsSetting.upsert({
        where: { key: UPLOAD_LIMIT_SETTING },
        create: { key: UPLOAD_LIMIT_SETTING, value: maximumMegabytes },
        update: { value: maximumMegabytes },
      });
      await tx.contentAuditLog.create({
        data: {
          actorId: user.id,
          action: 'PROJECT_UPLOAD_LIMIT_UPDATED',
          entityType: 'SYSTEM_SETTING',
          entityId: UPLOAD_LIMIT_SETTING,
          detail: { maximumMegabytes } satisfies Prisma.InputJsonObject,
        },
      });
    });
    return { maximumMegabytes };
  }

  private parseConfiguredLimit(value: Prisma.JsonValue): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_UPLOAD_LIMIT_MB) {
      throw new ServiceUnavailableException('The stored project upload limit is invalid.');
    }
    return value;
  }

  private environmentDefault(): number {
    const value = process.env.MAX_PROJECT_UPLOAD_SIZE_MB?.trim();
    if (!value) return DEFAULT_UPLOAD_LIMIT_MB;
    const megabytes = Number(value);
    if (!Number.isInteger(megabytes) || megabytes < 1 || megabytes > MAX_UPLOAD_LIMIT_MB) {
      throw new ServiceUnavailableException(`MAX_PROJECT_UPLOAD_SIZE_MB must be a whole number between 1 and ${MAX_UPLOAD_LIMIT_MB}.`);
    }
    return megabytes;
  }
}
