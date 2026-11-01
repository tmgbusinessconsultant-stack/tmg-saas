import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PuckContentValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    if (!body) return next.handle();
    let pageTree = body.content || body.data || body;
    if (pageTree && Array.isArray(pageTree.content)) {
      pageTree.content = pageTree.content.map((component: any) => {
        if (
          ['DynamicCards', 'StatsBar', 'FeaturesMatrix'].includes(component.type) &&
          component.props?.itemsJson
        ) {
          const rawPayload = component.props.itemsJson;
          if (typeof rawPayload === 'string') {
            try {
              const parsed = JSON.parse(rawPayload);
              if (!Array.isArray(parsed)) {
                component.props.itemsJson = JSON.stringify([]);
              }
            } catch {
              component.props.itemsJson = this.attemptHeuristicJsonRepair(rawPayload);
            }
          } else if (typeof rawPayload === 'object' && rawPayload !== null) {
            component.props.itemsJson = JSON.stringify(rawPayload);
          } else {
            component.props.itemsJson = JSON.stringify([]);
          }
        }
        return component;
      });
    }
    return next.handle();
  }

  private attemptHeuristicJsonRepair(raw: string): string {
    let cleaned = raw.trim();
    if (!cleaned.startsWith('[') && !cleaned.endsWith(']')) {
      return JSON.stringify([]);
    }
    try {
      cleaned = cleaned.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      return JSON.stringify(JSON.parse(cleaned));
    } catch {
      return JSON.stringify([]);
    }
  }
}
