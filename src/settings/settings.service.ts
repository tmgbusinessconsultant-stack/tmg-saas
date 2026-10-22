import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

const UPLOAD_LIMIT_SETTING = 'projectUploadLimitMb';
const DEFAULT_UPLOAD_LIMIT_MB = 100;
const MAX_UPLOAD_LIMIT_MB = 2048;

@Injectable()
export class SettingsService {
  private cache = new Map<string, { value: string; expires: number }>();
  private TTL = 30_000;

  constructor(private readonly prisma: PrismaService) { }

  // === YOUR EXISTING CODE - UNCHANGED ===
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

  // === NEW TAB 1 HYBRID - ADDITION ONLY ===
  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    try {
      const row = await this.prisma.setting.findUnique({ where: { key } });
      if (row?.value) {
        this.cache.set(key, { value: row.value, expires: Date.now() + this.TTL });
        return row.value;
      }
    } catch { }
    const envVal = process.env[key] || null;
    if (envVal) this.cache.set(key, { value: envVal, expires: Date.now() + this.TTL });
    return envVal;
  }

  async getEffective(key: string) {
    let dbValue: string | null = null;
    let updatedAt: Date | null = null;
    let updatedBy: string | null = null;
    try {
      const row = await this.prisma.setting.findUnique({ where: { key } });
      if (row) {
        dbValue = row.value;
        updatedAt = row.updatedAt;
        updatedBy = row.updatedBy;
      }
    } catch { }
    const envValue = process.env[key] || null;
    const effective = dbValue ?? envValue ?? null;
    return {
      key,
      effectiveValue: effective,
      dbValue,
      envValue,
      source: dbValue ? 'database' : envValue ? 'env' : 'none',
      updatedAt,
      updatedBy,
    };
  }

  async getAllPublic() {
    const keys = [
      'TURNSTILE_SITE_KEY',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_ALLOWED_HOSTNAMES',
      'MAX_PROJECT_UPLOAD_SIZE_MB',
      'PAYPAL_ENV',
      'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
      'AWS_REGION',
      'AWS_S3_BUCKET',
    ];
    return Promise.all(keys.map((k) => this.getEffective(k)));
  }

  async setPublic(key: string, value: string, user: AuthenticatedUser) {
    const allowedTab1 = [
      'TURNSTILE_SITE_KEY',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_ALLOWED_HOSTNAMES',
      'MAX_PROJECT_UPLOAD_SIZE_MB',
      'PAYPAL_ENV',
      'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
      'AWS_REGION',
      'AWS_S3_BUCKET',
    ];
    if (!allowedTab1.includes(key)) {
      throw new BadRequestException(`Key ${key} not allowed in Tab 1`);
    }
    this.cache.delete(key);
    const existing = await this.prisma.setting.findUnique({ where: { key } }).catch(() => null);
    await this.prisma.settingAudit
      .create({
        data: { key, oldValue: existing?.value || null, newValue: value, changedBy: user.email },
      })
      .catch(() => { });
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, isPublic: true, updatedBy: user.email },
      create: { key, value, isPublic: true, updatedBy: user.email },
    });
  }

  async deletePublic(key: string) {
    this.cache.delete(key);
    return this.prisma.setting.delete({ where: { key } }).catch(() => null);
  }
}