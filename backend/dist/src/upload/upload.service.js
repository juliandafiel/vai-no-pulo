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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let UploadService = class UploadService {
    constructor() {
        this.uploadPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }
    async saveFile(file, folder = 'general') {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado');
        }
        const folderPath = path.join(this.uploadPath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const fileExtension = path.extname(file.originalname);
        const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        const filePath = path.join(folderPath, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${folder}/${fileName}`;
    }
    async saveBase64(base64Data, folder = 'general') {
        if (!base64Data) {
            throw new common_1.BadRequestException('Nenhum dado enviado');
        }
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new common_1.BadRequestException('Formato de base64 inválido');
        }
        const mimeType = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        const extensionMap = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
        };
        const extension = extensionMap[mimeType] || '.bin';
        const folderPath = path.join(this.uploadPath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const fileName = `${(0, uuid_1.v4)()}${extension}`;
        const filePath = path.join(folderPath, fileName);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/${folder}/${fileName}`;
    }
    deleteFile(fileUrl) {
        try {
            const filePath = path.join(process.cwd(), fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            return false;
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map