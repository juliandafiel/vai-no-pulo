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
exports.ObjectsController = void 0;
const common_1 = require("@nestjs/common");
const objects_service_1 = require("./objects.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let ObjectsController = class ObjectsController {
    constructor(objectsService) {
        this.objectsService = objectsService;
    }
    async create(body, req) {
        const { name, description, category, subcategory, brand, weight, height, width, depth, length, declaredValue, isFragile, requiresRefrigeration, requiresSpecialCare, specialCareNotes, photos, videos, } = body;
        const data = {
            name,
            category,
            photos: photos || [],
            videos: videos || [],
            user: { connect: { id: req.user.userId } },
        };
        if (description !== undefined)
            data.description = description;
        if (subcategory !== undefined)
            data.subcategory = subcategory;
        if (brand !== undefined)
            data.brand = brand;
        if (weight !== undefined)
            data.weight = weight;
        if (height !== undefined)
            data.height = height;
        if (width !== undefined)
            data.width = width;
        if (depth !== undefined)
            data.depth = depth;
        if (length !== undefined)
            data.depth = length;
        if (declaredValue !== undefined)
            data.declaredValue = declaredValue;
        if (isFragile !== undefined)
            data.isFragile = isFragile;
        if (requiresRefrigeration !== undefined)
            data.requiresRefrigeration = requiresRefrigeration;
        if (requiresSpecialCare !== undefined)
            data.requiresSpecialCare = requiresSpecialCare;
        if (specialCareNotes !== undefined)
            data.specialCareNotes = specialCareNotes;
        return this.objectsService.create(data);
    }
    findAll(req) {
        return this.objectsService.findAll(req.user.userId);
    }
    findOne(id, req) {
        return this.objectsService.findOne(id, req.user.userId);
    }
    update(id, body, req) {
        const { name, description, category, subcategory, brand, weight, height, width, depth, length, declaredValue, isFragile, requiresRefrigeration, requiresSpecialCare, specialCareNotes, photos, videos, } = body;
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (description !== undefined)
            data.description = description;
        if (category !== undefined)
            data.category = category;
        if (subcategory !== undefined)
            data.subcategory = subcategory;
        if (brand !== undefined)
            data.brand = brand;
        if (weight !== undefined)
            data.weight = weight;
        if (height !== undefined)
            data.height = height;
        if (width !== undefined)
            data.width = width;
        if (depth !== undefined)
            data.depth = depth;
        if (length !== undefined)
            data.depth = length;
        if (declaredValue !== undefined)
            data.declaredValue = declaredValue;
        if (isFragile !== undefined)
            data.isFragile = isFragile;
        if (requiresRefrigeration !== undefined)
            data.requiresRefrigeration = requiresRefrigeration;
        if (requiresSpecialCare !== undefined)
            data.requiresSpecialCare = requiresSpecialCare;
        if (specialCareNotes !== undefined)
            data.specialCareNotes = specialCareNotes;
        if (photos !== undefined)
            data.photos = photos;
        if (videos !== undefined)
            data.videos = videos;
        return this.objectsService.update(id, req.user.userId, data);
    }
    delete(id, req) {
        return this.objectsService.delete(id, req.user.userId);
    }
};
exports.ObjectsController = ObjectsController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an object' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ObjectsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my objects' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ObjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get object by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ObjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an object' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ObjectsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an object' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ObjectsController.prototype, "delete", null);
exports.ObjectsController = ObjectsController = __decorate([
    (0, swagger_1.ApiTags)('objects'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('objects'),
    __metadata("design:paramtypes", [objects_service_1.ObjectsService])
], ObjectsController);
//# sourceMappingURL=objects.controller.js.map