import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(body: any): Promise<{
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        email: string;
        passwordHash: string;
        phone: string | null;
        verifiedEmail: boolean;
        createdAt: Date;
    }>;
    getProfile(req: any): any;
}
