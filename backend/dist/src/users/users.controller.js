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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const mail_service_1 = require("../mail/mail.service");
let UsersController = class UsersController {
    constructor(usersService, mailService) {
        this.usersService = usersService;
        this.mailService = mailService;
    }
    async findAll(status, role) {
        return this.usersService.findAll(status, role);
    }
    async findOne(id) {
        return this.usersService.findById(id);
    }
    async approve(id, req) {
        const user = await this.usersService.approve(id, req.user.userId);
        await this.mailService.sendProfileApprovedEmail(user.email, user.name);
        return {
            success: true,
            message: 'Usuário aprovado com sucesso',
            user,
        };
    }
    async reject(id, body, req) {
        const user = await this.usersService.reject(id, body.reason, req.user.userId);
        await this.mailService.sendProfileRejectedEmail(user.email, user.name, body.reason);
        return {
            success: true,
            message: 'Usuário rejeitado',
            user,
        };
    }
    async countPending() {
        return this.usersService.countPending();
    }
    async updateProfile(body, req) {
        return this.usersService.updateProfile(req.user.userId, body);
    }
    async updatePushToken(body, req) {
        return this.usersService.updatePushToken(req.user.userId, body.pushToken);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all users (Admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, enum: ['USER', 'DRIVER', 'ADMIN'] }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve user profile (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject user profile (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reject", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('pending/count'),
    (0, swagger_1.ApiOperation)({ summary: 'Count pending users (Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "countPending", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                name: 'João Silva',
                birthDate: '01/01/1990',
                profilePhoto: 'data:image/jpeg;base64,...',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)('push-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user push notification token' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                pushToken: 'ExponentPushToken[xxxxxx]',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePushToken", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mail_service_1.MailService])
], UsersController);
//# sourceMappingURL=users.controller.js.map