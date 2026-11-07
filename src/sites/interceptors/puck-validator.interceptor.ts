import {
  BadRequestException,
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
                throw new BadRequestException('Component itemsJson must contain a JSON array.');
              }
            } catch (error) {
              if (error instanceof BadRequestException) throw error;
              throw new BadRequestException('Component itemsJson contains invalid JSON.');
            }
          } else if (typeof rawPayload === 'object' && rawPayload !== null) {
            if (!Array.isArray(rawPayload)) {
              throw new BadRequestException('Component itemsJson must contain an array.');
            }
            component.props.itemsJson = JSON.stringify(rawPayload);
          } else {
            throw new BadRequestException('Component itemsJson must contain an array.');
          }
        }
        return component;
      });
    }
    return next.handle();
  }

}
