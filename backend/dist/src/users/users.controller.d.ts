import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
export declare class UsersController {
    private readonly usersService;
    private readonly mailService;
    constructor(usersService: UsersService, mailService: MailService);
    findAll(status?: string, role?: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        email: string;
        name: string;
        phone: string;
        profileStatus: import(".prisma/client").$Enums.ProfileStatus;
        profilePhoto: string;
        documentType: string;
        documentNumber: string;
        documentFront: string;
        documentBack: string;
        approvedAt: Date;
        rejectedAt: Date;
        rejectionReason: string;
        createdAt: Date;
        cpf: string;
        rg: string;
        birthDate: string;
        cnh: string;
        cnhCategory: string;
        cnhExpiry: string;
    }[]>;
    findOne(id: string): Promise<{
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
    approve(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        user: {
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
        };
    }>;
    reject(id: string, body: {
        reason: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        user: {
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
        };
    }>;
    countPending(): Promise<{
        count: number;
    }>;
    updateProfile(body: {
        name?: string;
        birthDate?: string;
        profilePhoto?: string;
    }, req: any): Promise<{
        userType: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        email: string;
        name: string;
        phone: string;
        profilePhoto: string;
        birthDate: string;
    }>;
    updatePushToken(body: {
        pushToken: string | null;
    }, req: any): Promise<{
        success: boolean;
    }>;
}
