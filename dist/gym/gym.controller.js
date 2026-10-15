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
exports.GymController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let GymController = class GymController {
    async get() {
        let gym = await prisma.gym.findFirst();
        if (!gym)
            gym = await prisma.gym.create({ data: { name: 'TMG Business Consulting', phone: '+97470454450', email: 'tmgbusinessconsultant@gmail.com', address: 'Doha, Qatar', currency: 'USD' } });
        return gym;
    }
    async update(body) {
        let gym = await prisma.gym.findFirst();
        if (!gym)
            return this.get();
        return prisma.gym.update({ where: { id: gym.id }, data: { name: body.name, phone: body.phone, email: body.email, address: body.address, currency: 'USD' } });
    }
};
exports.GymController = GymController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GymController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GymController.prototype, "update", null);
exports.GymController = GymController = __decorate([
    (0, common_1.Controller)('gym')
], GymController);
//# sourceMappingURL=gym.controller.js.map