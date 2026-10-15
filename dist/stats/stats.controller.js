"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let StatsController = class StatsController {
    async get() {
        const gym = await prisma.gym.findFirst();
        if (!gym)
            return { members: 0, active: 0, revenue: 0, plans: 0, currency: 'USD' };
        const members = await prisma.member.count({ where: { gymId: gym.id } });
        const active = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
        const plans = await prisma.membershipPlan.count({ where: { gymId: gym.id } });
        const revenueAgg = await prisma.subscription.aggregate({ _sum: { amountPaid: true }, where: { paymentStatus: 'PAID' } });
        return { members, active, plans, revenue: revenueAgg._sum.amountPaid || 0, currency: 'USD' };
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "get", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats')
], StatsController);
//# sourceMappingURL=stats.controller.js.map