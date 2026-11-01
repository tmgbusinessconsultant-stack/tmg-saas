import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Reflector } from '@nestjs/core';
import { UserPlansController } from '../../src/user-plans/user-plans.controller';
import { RolesGuard } from '../../src/auth/roles.guard';
import { PaymentsController } from '../../src/payments/payments.controller';
import { SettingsController } from '../../src/settings/settings.controller';
import { ContentController } from '../../src/content/content.controller';

const superAdminRoutes: Array<{ label: string; controller: object; handler: Function }> = [
  ...([
    ['user plans list', 'getAll'],
    ['user plan assignment', 'assign'],
    ['user plan renewal', 'renew'],
    ['user plan status', 'updateStatus'],
    ['user plan auto-renew', 'updateAutoRenew'],
    ['user plan usage reset', 'resetUsage'],
    ['user plan tools', 'updateTools'],
  ] as const).map(([label, method]) => ({
    label,
    controller: UserPlansController,
    handler: UserPlansController.prototype[method],
  })),
  { label: 'payment list', controller: PaymentsController, handler: PaymentsController.prototype.list },
  { label: 'payment statistics', controller: PaymentsController, handler: PaymentsController.prototype.stats },
  { label: 'system setting update', controller: SettingsController, handler: SettingsController.prototype.setPublic },
  { label: 'system setting delete', controller: SettingsController, handler: SettingsController.prototype.del },
  { label: 'upload limit update', controller: SettingsController, handler: SettingsController.prototype.updateProjectUploadLimit },
  { label: 'CMS media upload', controller: ContentController, handler: ContentController.prototype.uploadMedia },
  { label: 'CMS blog update', controller: ContentController, handler: ContentController.prototype.updatePost },
  { label: 'CMS gallery update', controller: ContentController, handler: ContentController.prototype.updateGalleryItem },
];

function canAccess(handler: Function, controller: object, role?: string): boolean {
  const guard = new RolesGuard(new Reflector());
  return guard.canActivate({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => role ? { user: { role, permissions: [] } } : ({}) }),
  } as never);
}

describe('Super Admin-only API RBAC', () => {
  for (const route of superAdminRoutes) {
    it(`allows only Super Admin on ${route.label}`, () => {
      assert.equal(canAccess(route.handler, route.controller, 'SUPER_ADMIN'), true);
      assert.equal(canAccess(route.handler, route.controller, 'ADMIN'), false);
      assert.equal(canAccess(route.handler, route.controller, 'ADMIN_MANAGER'), false);
      assert.equal(canAccess(route.handler, route.controller, 'CLIENT'), false);
      assert.equal(canAccess(route.handler, route.controller), false);
    });
  }
});
