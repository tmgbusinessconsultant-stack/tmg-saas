import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserPlansService } from './user-plans.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private userPlans: UserPlansService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Login required');

    // Get tool id from route or body
    // For cv-documents: body.documentType contains tool name
    const body = req.body || {};
    const toolMap: Record<string, string> = {
      'cover-letter': 'cover-letter',
      'cv': 'cv-builder',
      'business-plan': 'business-plan',
      'judgement': 'document-review',
      'document-review': 'document-review',
      'policy-generator': 'policy-generator',
      'policy': 'policy-generator',
      'sop-builder': 'sop-builder',
      'sop': 'sop-builder',
      'business-contract': 'business-contracts',
      'contract': 'business-contracts',
      'proposal-pack': 'proposal-packs',
      'proposal': 'proposal-packs',
    };

    let toolId = 'cv-builder'; // default
    if (body.documentType) {
      toolId = toolMap[body.documentType] || body.documentType;
    } else if (body.type) {
      toolId = toolMap[body.type] || body.type;
    }

    // Check access
    try {
      await this.userPlans.checkToolAccess(user.id || user.sub, toolId);
      return true;
    } catch (e) {
      throw e;
    }
  }
}
