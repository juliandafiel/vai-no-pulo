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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    create(createMessageDto, req) {
        console.log('[MessagesController.create] userId:', req.user.userId, 'orderId:', createMessageDto.orderId, 'driverId:', createMessageDto.driverId);
        return this.messagesService.create(createMessageDto, req.user.userId);
    }
    getConversations(req) {
        console.log('[MessagesController.getConversations] userId:', req.user.userId);
        return this.messagesService.getConversations(req.user.userId);
    }
    getUnreadCount(req) {
        return this.messagesService.countUnread(req.user.userId);
    }
    getOrderMessages(orderId, driverId, req) {
        console.log('[MessagesController.getOrderMessages] userId:', req.user.userId, 'orderId:', orderId, 'driverId:', driverId);
        return this.messagesService.findByOrder(orderId, req.user.userId, driverId);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message in order chat' }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                orderId: 'uuid-do-pedido',
                driverId: 'uuid-do-motorista (opcional, necessário para cliente em pedidos avulsos)',
                content: 'Ola, tenho interesse no seu percurso!',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all conversations for the user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get count of unread messages' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('order/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all messages for an order (with specific driver)' }),
    (0, swagger_1.ApiQuery)({ name: 'driverId', required: false, description: 'ID do motorista para conversas específicas' }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Query)('driverId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getOrderMessages", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('messages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map