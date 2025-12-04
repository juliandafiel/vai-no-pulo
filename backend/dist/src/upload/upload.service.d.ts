export declare class UploadService {
    private readonly uploadPath;
    constructor();
    saveFile(file: Express.Multer.File, folder?: string): Promise<string>;
    saveBase64(base64Data: string, folder?: string): Promise<string>;
    deleteFile(fileUrl: string): boolean;
}
