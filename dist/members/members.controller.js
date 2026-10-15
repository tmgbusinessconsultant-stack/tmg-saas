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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let MembersController = class MembersController {
    async getAll() {
        const gym = await prisma.gym.findFirst();
        if (!gym)
            return [];
        return prisma.member.findMany({ where: { gymId: gym.id }, orderBy: { joinDate: 'desc' } });
    }
    async create(body) {
        let gym = await prisma.gym.findFirst();
        if (!gym)
            gym = await prisma.gym.create({ data: { name: 'TMG Business Consulting', currency: 'USD' } });
        return prisma.member.create({ data: { gymId: gym.id, name: body.name, phone: body.phone, email: body.email, qatarId: body.qatarId } });
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "create", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('members')
], MembersController);
//# sourceMappingURL=members.controller.js.map