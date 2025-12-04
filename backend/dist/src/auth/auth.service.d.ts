import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private mailService;
    private smsService;
    private verificationCodes;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService, smsService: SmsService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        token: string;
        user: any;
    }>;
    register(data: any): Promise<{
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
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    sendVerificationCode(email?: string, phone?: string): Promise<{
        success: boolean;
        message: string;
        sentMethods: string[];
        expiresIn: string;
    }>;
    verifyCode(emailOrPhone: string, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    registerCustomer(data: any): Promise<{
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
    registerDriver(data: any): Promise<{
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
    private cleanExpiredCodes;
    checkEmailExists(email: string): Promise<{
        exists: boolean;
        message?: undefined;
    } | {
        exists: boolean;
        message: string;
    }>;
    updateDocuments(userId: string, data: {
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
