import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';

const multerOptions = {
    storage: memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
};

@ApiTags('upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post()
    @ApiOperation({ summary: 'Upload single file (shorthand)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string,
    ) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        const url = await this.uploadService.saveFile(file, folder || 'objects');
        return {
            success: true,
            url,
            originalName: file.originalname,
            size: file.size,
        };
    }

    @Post('file')
    @ApiOperation({ summary: 'Upload single file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
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
    })
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string,
    ) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        const url = await this.uploadService.saveFile(file, folder || 'general');
        return {
            success: true,
            url,
            originalName: file.originalname,
            size: file.size,
        };
    }

    @Post('files')
    @ApiOperation({ summary: 'Upload multiple files' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        const results = await Promise.all(
            files.map(async (file) => {
                const url = await this.uploadService.saveFile(file, folder || 'general');
                return {
                    url,
                    originalName: file.originalname,
                    size: file.size,
                };
            }),
        );

        return {
            success: true,
            files: results,
        };
    }

    @Post('base64')
    @ApiOperation({ summary: 'Upload file as base64' })
    @ApiBody({
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
    })
    async uploadBase64(@Body() body: { data: string; folder?: string }) {
        if (!body.data) {
            throw new BadRequestException('Nenhum dado enviado');
        }

        const url = await this.uploadService.saveBase64(body.data, body.folder || 'general');
        return {
            success: true,
            url,
        };
    }

    @Post('documents')
    @ApiOperation({ summary: 'Upload user documents (profile photo, document front/back)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
    async uploadDocuments(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: { types: string },
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        const types = body.types ? JSON.parse(body.types) : [];
        const results: { [key: string]: string } = {};

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
}
