import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class CmsMediaStorageService {
  private readonly logger = new Logger(CmsMediaStorageService.name);

  private baseDir(): string {
    const dir = process.env.LOCAL_STORAGE_DIR?.trim() || 'storage/cms';
    return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
  }

  private resolveKey(key: string): string {
    // Prevent path traversal: media/<uuid> -> <base>/media/<uuid>
    const safe = key.replace(/\\/g, '/').split('/').filter((p) => p && p !== '.' && p !== '..');
    return path.join(this.baseDir(), ...safe);
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      const file = this.resolveKey(key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, body);
      // Store content-type alongside for future use
      await fs.writeFile(file + '.meta.json', JSON.stringify({ contentType })).catch(() => {});
    } catch (error) {
      this.logger.error('CMS media upload to local storage failed.', error);
      throw new ServiceUnavailableException('Media storage is unavailable.');
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.resolveKey(key));
    } catch (error: any) {
      if (error?.code === 'ENOENT') throw new NotFoundException('Media not found');
      this.logger.error('CMS media download from local storage failed.', error);
      throw new ServiceUnavailableException('Media storage is unavailable.');
    }
  }

  async getScanResult(key: string): Promise<string | null> {
    // Local mode: no GuardDuty. content.service.ts already does signature validation on upload.
    // Return NO_THREATS so refreshMediaScan() marks AVAILABLE instead of stuck SCANNING.
    try {
      await fs.access(this.resolveKey(key));
      return 'NO_THREATS_FOUND';
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const file = this.resolveKey(key);
      await fs.rm(file, { force: true });
      await fs.rm(file + '.meta.json', { force: true }).catch(() => {});
    } catch (error) {
      this.logger.error('CMS media cleanup in local storage failed.', error);
      throw new ServiceUnavailableException('Media storage cleanup failed.');
    }
  }
}

