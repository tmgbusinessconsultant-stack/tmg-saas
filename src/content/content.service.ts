import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getPosts() {
    return (this.prisma as any).contentPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostBySlug(slug: string) {
    const post = await (this.prisma as any).contentPost.findUnique({ where: { slug } });
    if (!post || post.status !== 'PUBLISHED') throw new NotFoundException('Post not found');
    return post;
  }

  async getMedia() {
    try {
      const media = await (this.prisma as any).contentMedia.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      // Safe: never throw if fileData missing
      return media.map((m: any) => ({
        ...m,
        fileData: undefined, // don't send huge base64 to frontend
        hasFile: !!m.fileData,
      }));
    } catch (e: any) {
      console.error('getMedia error:', e.message);
      return []; // return empty instead of 500
    }
  }

  async getMediaFile(id: string) {
    const media = await (this.prisma as any).contentMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async streamMedia(id: string) {
    const media = await this.getMediaFile(id);
    let body: Buffer;
    try {
      if (media.fileData && media.fileData.length > 20) {
        try {
          body = Buffer.from(media.fileData, 'base64');
          if (body.length < 10) body = Buffer.from(media.fileData);
        } catch {
          body = Buffer.from(media.fileData);
        }
      } else {
        body = Buffer.alloc(0);
      }
    } catch {
      body = Buffer.alloc(0);
    }
    return { media, body };
  }
}
