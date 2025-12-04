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
exports.VehicleChangeRequestController = void 0;
const common_1 = require("@nestjs/common");
const vehicle_change_request_service_1 = require("./vehicle-change-request.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let VehicleChangeRequestController = class VehicleChangeRequestController {
    constructor(changeRequestService) {
        this.changeRequestService = changeRequestService;
    }
    create(createDto, req) {
        return this.changeRequestService.create(req.user.userId, createDto);
    }
    findMyRequests(req) {
        return this.changeRequestService.findByDriver(req.user.userId);
    }
    findPending() {
        return this.changeRequestService.findAllPending();
    }
    findAll(status) {
        return this.changeRequestService.findAll(status);
    }
    findOne(id) {
        return this.changeRequestService.findOne(id);
    }
    approve(id, body, req) {
        return this.changeRequestService.review(id, req.user.userId, {
            status: 'APPROVED',
            adminMessage: body.message,
        });
    }
    reject(id, body, req) {
        return this.changeRequestService.review(id, req.user.userId, {
            status: 'REJECTED',
            rejectionReason: body.rejectionReason,
        });
    }
    cancel(id, req) {
        return this.changeRequestService.cancel(id, req.user.userId);
    }
    hasPending(vehicleId) {
        return this.changeRequestService.hasPendingRequest(vehicleId);
    }
};
exports.VehicleChangeRequestController = VehicleChangeRequestController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar solicitação de alteração de veículo' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('my-requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar minhas solicitações de alteração' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "findMyRequests", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar solicitações pendentes (Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "findPending", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as solicitações (Admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter detalhes de uma solicitação' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Aprovar solicitação de alteração (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Rejeitar solicitação de alteração (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "reject", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar solicitação de alteração' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "cancel", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('vehicle/:vehicleId/has-pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar se veículo tem solicitação pendente' }),
    __param(0, (0, common_1.Param)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleChangeRequestController.prototype, "hasPending", null);
exports.VehicleChangeRequestController = VehicleChangeRequestController = __decorate([
    (0, swagger_1.ApiTags)('vehicle-change-requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('vehicle-change-requests'),
    __metadata("design:paramtypes", [vehicle_change_request_service_1.VehicleChangeRequestService])
], VehicleChangeRequestController);
//# sourceMappingURL=vehicle-change-request.controller.js.map