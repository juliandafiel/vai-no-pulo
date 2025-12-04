import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(data: any): Promise<{
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        email: string;
        passwordHash: string;
        phone: string | null;
        verifiedEmail: boolean;
        createdAt: Date;
    }>;
}
