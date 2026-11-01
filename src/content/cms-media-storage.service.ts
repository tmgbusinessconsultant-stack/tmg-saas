import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class CmsMediaStorageService {
  private readonly logger = new Logger(CmsMediaStorageService.name);
  private client: S3Client | undefined;

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    const { client, bucket } = this.getStorage();
    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentLength: body.byteLength,
        ContentType: contentType,
      }));
    } catch (error) {
      this.logger.error('CMS media upload to private object storage failed.', error);
      throw new ServiceUnavailableException('Media storage is unavailable.');
    }
  }

  async getObject(key: string): Promise<Buffer> {
    const { client, bucket } = this.getStorage();
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!response.Body) {
        throw new Error('Object storage returned an empty media body.');
      }
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      this.logger.error('CMS media download from private object storage failed.', error);
      throw new ServiceUnavailableException('Media storage is unavailable.');
    }
  }

  async getScanResult(key: string): Promise<string | null> {
    const { client, bucket } = this.getStorage();
    try {
      const response = await client.send(new GetObjectTaggingCommand({ Bucket: bucket, Key: key }));
      const scanTagKey = process.env.AWS_S3_SCAN_TAG_KEY?.trim() || 'GuardDutyMalwareScanStatus';
      return response.TagSet?.find((tag) => tag.Key === scanTagKey)?.Value ?? null;
    } catch (error) {
      this.logger.error('CMS media malware scan result could not be retrieved.', error);
      throw new ServiceUnavailableException('Media scan status is temporarily unavailable.');
    }
  }

  async deleteObject(key: string): Promise<void> {
    const { client, bucket } = this.getStorage();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      this.logger.error('CMS media cleanup in private object storage failed.', error);
      throw new ServiceUnavailableException('Media storage cleanup failed.');
    }
  }

  private getStorage(): { client: S3Client; bucket: string } {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    const region = process.env.AWS_REGION?.trim();
    if (!bucket || !region) {
      throw new ServiceUnavailableException('CMS media requires AWS_S3_BUCKET and AWS_REGION.');
    }

    this.client ??= new S3Client({
      region,
      endpoint: process.env.AWS_S3_ENDPOINT?.trim() || undefined,
    });
    return { client: this.client, bucket };
  }
}
