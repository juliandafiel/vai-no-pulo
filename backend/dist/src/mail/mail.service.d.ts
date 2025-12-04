export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendVerificationCode(email: string, code: string, name: string): Promise<boolean>;
    sendWelcomeEmail(email: string, name: string, userType: 'USER' | 'DRIVER'): Promise<boolean>;
    sendForgotPasswordEmail(email: string, token: string): Promise<boolean>;
    sendProfileApprovedEmail(email: string, name: string): Promise<boolean>;
    sendProfileRejectedEmail(email: string, name: string, reason: string): Promise<boolean>;
    sendVehicleChangeApprovedEmail(email: string, name: string, vehicleModel: string, vehiclePlate: string, adminMessage?: string): Promise<boolean>;
    sendVehicleChangeRejectedEmail(email: string, name: string, vehicleModel: string, vehiclePlate: string, reason: string): Promise<boolean>;
    sendVehicleApprovedEmail(email: string, name: string, vehicleModel: string, vehiclePlate: string, adminMessage?: string): Promise<boolean>;
    sendVehicleRejectedEmail(email: string, name: string, vehicleModel: string, vehiclePlate: string, reason: string): Promise<boolean>;
}
