export declare class SmsService {
    private client;
    private readonly logger;
    private readonly fromNumber;
    constructor();
    sendVerificationCode(phone: string, code: string, name: string): Promise<boolean>;
    isConfigured(): boolean;
}
