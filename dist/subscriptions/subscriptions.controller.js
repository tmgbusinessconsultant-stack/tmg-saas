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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let SubscriptionsController = class SubscriptionsController {
    async getAll() { return prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } }); }
    async create(body) {
        const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } });
        if (!plan)
            throw new Error('Plan not found');
        const start = new Date(body.startDate || new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + plan.duration);
        const sub = await prisma.subscription.create({ data: { memberId: body.memberId, planId: body.planId, startDate: start, endDate: end, status: 'ACTIVE', paymentStatus: 'PAID', paymentMethod: body.paymentMethod || 'CASH', amountPaid: body.amountPaid ? parseFloat(body.amountPaid) : plan.price, remainingSessions: plan.sessions || null } });
        await prisma.member.update({ where: { id: body.memberId }, data: { status: 'ACTIVE' } });
        return sub;
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "create", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions')
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map