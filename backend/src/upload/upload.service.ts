import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private readonly uploadPath = path.join(process.cwd(), 'uploads');

    constructor() {
        // Cria o diretório de uploads se não existir
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async saveFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        // Cria subdiretório se não existir
        const folderPath = path.join(this.uploadPath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Gera nome único para o arquivo
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(folderPath, fileName);

        // Salva o arquivo
        fs.writeFileSync(filePath, file.buffer);

        // Retorna a URL relativa
        return `/uploads/${folder}/${fileName}`;
    }

    async saveBase64(base64Data: string, folder: string = 'general'): Promise<string> {
        if (!base64Data) {
            throw new BadRequestException('Nenhum dado enviado');
        }

        // Extrai o tipo e os dados do base64
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new BadRequestException('Formato de base64 inválido');
        }

        const mimeType = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        // Determina a extensão baseado no mime type
        const extensionMap: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
        };
        const extension = extensionMap[mimeType] || '.bin';

        // Cria subdiretório se não existir
        const folderPath = path.join(this.uploadPath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Gera nome único para o arquivo
        const fileName = `${uuidv4()}${extension}`;
        const filePath = path.join(folderPath, fileName);

        // Salva o arquivo
        fs.writeFileSync(filePath, buffer);

        // Retorna a URL relativa
        return `/uploads/${folder}/${fileName}`;
    }

    deleteFile(fileUrl: string): boolean {
        try {
            const filePath = path.join(process.cwd(), fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            return false;
        }
    }
}
