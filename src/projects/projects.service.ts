import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enterprise Project Inventory Track Sourcing Engine
   * Dynamically aggregates database relations while preserving clean frontend field keys
   */
  async list(user: AuthenticatedUser) {
    this.logger.log(`Pulling matching project track matrices for profile: ${user.id}`);
    
    const baseProjects = await this.prisma.project.findMany({
      where: {
        ownerId: user.id
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 200,
      include: {
        User_Project_ownerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_Project_assigneeIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ProjectFile: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            originalName: true,
            contentType: true,
            size: true,
            kind: true,
            status: true,
            version: true,
            uploadedById: true,
            createdAt: true,
          },
        },
        ProjectMessage: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 100,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        ProjectActivity: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });

    // Hydrate relational blocks back to explicit clean names for frontend contract continuity
    return baseProjects.map((p: any) => {
      const {
        User_Project_ownerIdToUser,
        User_Project_assigneeIdToUser,
        ProjectFile,
        ProjectMessage,
        ProjectActivity,
        ...rest
      } = p;

      return {
        ...rest,
        owner: User_Project_ownerIdToUser || null,
        assignee: User_Project_assigneeIdToUser || null,
        files: ProjectFile || [],
        messages: ProjectMessage || [],
        activities: ProjectActivity || [],
      };
    });
  }
}