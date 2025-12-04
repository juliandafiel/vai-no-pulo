import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        token: string;
        user: any;
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    register(body: any): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        email: string;
        passwordHash: string | null;
        googleId: string | null;
        name: string;
        phone: string | null;
        verifiedEmail: boolean;
        profileStatus: import(".prisma/client").$Enums.ProfileStatus;
        profilePhoto: string | null;
        documentType: string | null;
        documentNumber: string | null;
        documentFront: string | null;
        documentBack: string | null;
        approvedAt: Date | null;
        approvedBy: string | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
        createdAt: Date;
        pushToken: string | null;
        cpf: string | null;
        rg: string | null;
        birthDate: string | null;
        cnh: string | null;
        cnhCategory: string | null;
        cnhExpiry: string | null;
    }>;
    getProfile(req: any): any;
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any): Promise<{
        access_token: string;
        token: string;
        user: any;
    }>;
    sendVerification(body: {
        email?: string;
        phone?: string;
    }): Promise<{
        success: boolean;
        message: string;
        sentMethods: string[];
        expiresIn: string;
    }>;
    verifyCode(body: {
        emailOrPhone: string;
        code: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    registerCustomer(body: any): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
            email: string;
            googleId: string | null;
            name: string;
            phone: string | null;
            verifiedEmail: boolean;
            profileStatus: import(".prisma/client").$Enums.ProfileStatus;
            profilePhoto: string | null;
            documentType: string | null;
            documentNumber: string | null;
            documentFront: string | null;
            documentBack: string | null;
            approvedAt: Date | null;
            approvedBy: string | null;
            rejectedAt: Date | null;
            rejectionReason: string | null;
            createdAt: Date;
            pushToken: string | null;
            cpf: string | null;
            rg: string | null;
            birthDate: string | null;
            cnh: string | null;
            cnhCategory: string | null;
            cnhExpiry: string | null;
        };
    }>;
    registerDriver(body: any): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
            email: string;
            googleId: string | null;
            name: string;
            phone: string | null;
            verifiedEmail: boolean;
            profileStatus: import(".prisma/client").$Enums.ProfileStatus;
            profilePhoto: string | null;
            documentType: string | null;
            documentNumber: string | null;
            documentFront: string | null;
            documentBack: string | null;
            approvedAt: Date | null;
            approvedBy: string | null;
            rejectedAt: Date | null;
            rejectionReason: string | null;
            createdAt: Date;
            pushToken: string | null;
            cpf: string | null;
            rg: string | null;
            birthDate: string | null;
            cnh: string | null;
            cnhCategory: string | null;
            cnhExpiry: string | null;
        };
    }>;
    checkEmail(body: {
        email: string;
    }): Promise<{
        exists: boolean;
        message?: undefined;
    } | {
        exists: boolean;
        message: string;
    }>;
    updateDocuments(req: any, body: {
        documentType: string;
        documentFront: string;
        documentBack: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
            email: string;
            name: string;
            phone: string;
            profilePhoto: string;
            documentType: string;
            documentFront: string;
            documentBack: string;
            birthDate: string;
        };
    }>;
}
