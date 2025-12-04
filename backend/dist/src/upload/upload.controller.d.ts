import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    upload(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
        originalName: string;
        size: number;
    }>;
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
        originalName: string;
        size: number;
    }>;
    uploadFiles(files: Express.Multer.File[], folder?: string): Promise<{
        success: boolean;
        files: {
            url: string;
            originalName: string;
            size: number;
        }[];
    }>;
    uploadBase64(body: {
        data: string;
        folder?: string;
    }): Promise<{
        success: boolean;
        url: string;
    }>;
    uploadDocuments(files: Express.Multer.File[], body: {
        types: string;
    }): Promise<{
        success: boolean;
        urls: {
            [key: string]: string;
        };
    }>;
}
