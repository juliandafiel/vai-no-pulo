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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const multer_1 = require("multer");
const multerOptions = {
    storage: (0, multer_1.memoryStorage)(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
};
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async upload(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado');
        }
        const url = await this.uploadService.saveFile(file, folder || 'objects');
        return {
            success: true,
            url,
            originalName: file.originalname,
            size: file.size,
        };
    }
    async uploadFile(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado');
        }
        const url = await this.uploadService.saveFile(file, folder || 'general');
        return {
            success: true,
            url,
            originalName: file.originalname,
            size: file.size,
        };
    }
    async uploadFiles(files, folder) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado');
        }
        const results = await Promise.all(files.map(async (file) => {
            const url = await this.uploadService.saveFile(file, folder || 'general');
            return {
                url,
                originalName: file.originalname,
                size: file.size,
            };
        }));
        return {
            success: true,
            files: results,
        };
    }
    async uploadBase64(body) {
        if (!body.data) {
            throw new common_1.BadRequestException('Nenhum dado enviado');
        }
        const url = await this.uploadService.saveBase64(body.data, body.folder || 'general');
        return {
            success: true,
            url,
        };
    }
    async uploadDocuments(files, body) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado');
        }
        const types = body.types ? JSON.parse(body.types) : [];
        const results = {};
        for (let i = 0; i < files.length; i++) {
            const type = types[i] || `file_${i}`;
            const folder = type.includes('document') ? 'documents' : 'profiles';
            const url = await this.uploadService.saveFile(files[i], folder);
            results[type] = url;
        }
        return {
            success: true,
            urls: results,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload single file (shorthand)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerOptions)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('file'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload single file' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                folder: {
                    type: 'string',
                    description: 'Folder to save the file (e.g., documents, profiles)',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerOptions)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('files'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload multiple files' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, multerOptions)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFiles", null);
__decorate([
    (0, common_1.Post)('base64'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload file as base64' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'string',
                    description: 'Base64 encoded file data (with data:mime;base64, prefix)',
                },
                folder: {
                    type: 'string',
                    description: 'Folder to save the file',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadBase64", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload user documents (profile photo, document front/back)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 5, multerOptions)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadDocuments", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('upload'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map