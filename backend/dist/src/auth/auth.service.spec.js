"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const mail_service_1 = require("../mail/mail.service");
const sms_service_1 = require("../sms/sms.service");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    let mailService;
    let smsService;
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2b$10$hashedpassword',
        role: 'USER',
        profileStatus: 'APPROVED',
        phone: '11999999999',
    };
    const mockUsersService = {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        updateById: jest.fn(),
    };
    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };
    const mockMailService = {
        sendVerificationCode: jest.fn(),
        sendWelcomeEmail: jest.fn(),
        sendForgotPasswordEmail: jest.fn(),
    };
    const mockSmsService = {
        sendVerificationCode: jest.fn(),
        isConfigured: jest.fn().mockReturnValue(true),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: mockUsersService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: mail_service_1.MailService, useValue: mockMailService },
                { provide: sms_service_1.SmsService, useValue: mockSmsService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
        mailService = module.get(mail_service_1.MailService);
        smsService = module.get(sms_service_1.SmsService);
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('validateUser', () => {
        it('should return user without password when credentials are valid', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const userWithHash = Object.assign(Object.assign({}, mockUser), { passwordHash: hashedPassword });
            mockUsersService.findOne.mockResolvedValue(userWithHash);
            const result = await service.validateUser('test@example.com', 'password123');
            expect(result).toBeDefined();
            expect(result.passwordHash).toBeUndefined();
            expect(result.email).toBe('test@example.com');
        });
        it('should return null when user is not found', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            const result = await service.validateUser('notfound@example.com', 'password123');
            expect(result).toBeNull();
        });
        it('should return null when password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            mockUsersService.findOne.mockResolvedValue(Object.assign(Object.assign({}, mockUser), { passwordHash: hashedPassword }));
            const result = await service.validateUser('test@example.com', 'wrongpassword');
            expect(result).toBeNull();
        });
    });
    describe('login', () => {
        it('should return access token and user for approved user', async () => {
            const result = await service.login(mockUser);
            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.token).toBe('mock-jwt-token');
            expect(result.user).toBeDefined();
            expect(result.user.userType).toBe('customer');
        });
        it('should return driver userType for DRIVER role', async () => {
            const driverUser = Object.assign(Object.assign({}, mockUser), { role: 'DRIVER' });
            const result = await service.login(driverUser);
            expect(result.user.userType).toBe('driver');
        });
        it('should throw UnauthorizedException for PENDING profile', async () => {
            const pendingUser = Object.assign(Object.assign({}, mockUser), { profileStatus: 'PENDING' });
            await expect(service.login(pendingUser)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException for REJECTED profile', async () => {
            const rejectedUser = Object.assign(Object.assign({}, mockUser), { profileStatus: 'REJECTED', rejectionReason: 'Documents invalid' });
            await expect(service.login(rejectedUser)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('sendVerificationCode', () => {
        it('should send verification code via email', async () => {
            mockMailService.sendVerificationCode.mockResolvedValue(undefined);
            const result = await service.sendVerificationCode('test@example.com');
            expect(result.success).toBe(true);
            expect(result.sentMethods).toContain('e-mail');
            expect(mockMailService.sendVerificationCode).toHaveBeenCalled();
        });
        it('should send verification code via SMS', async () => {
            mockSmsService.sendVerificationCode.mockResolvedValue(undefined);
            const result = await service.sendVerificationCode(undefined, '11999999999');
            expect(result.success).toBe(true);
            expect(result.sentMethods).toContain('SMS');
        });
        it('should throw BadRequestException when no email or phone provided', async () => {
            await expect(service.sendVerificationCode()).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when all methods fail', async () => {
            mockMailService.sendVerificationCode.mockRejectedValue(new Error('Email failed'));
            mockSmsService.isConfigured.mockReturnValue(false);
            await expect(service.sendVerificationCode('test@example.com')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('verifyCode', () => {
        beforeEach(async () => {
            mockMailService.sendVerificationCode.mockResolvedValue(undefined);
            await service.sendVerificationCode('test@example.com');
        });
        it('should throw BadRequestException for invalid code', async () => {
            await expect(service.verifyCode('test@example.com', '000000')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException for non-existent code', async () => {
            await expect(service.verifyCode('other@example.com', '123456')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('registerCustomer', () => {
        it('should create a new customer successfully', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            mockUsersService.create.mockResolvedValue(Object.assign(Object.assign({}, mockUser), { passwordHash: 'hashedpassword' }));
            mockMailService.sendWelcomeEmail.mockResolvedValue(undefined);
            const result = await service.registerCustomer({
                fullName: 'Test User',
                email: 'new@example.com',
                phone: '11999999999',
                password: 'password123',
            });
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.passwordHash).toBeUndefined();
            expect(mockMailService.sendWelcomeEmail).toHaveBeenCalled();
        });
        it('should throw BadRequestException if email already exists', async () => {
            mockUsersService.findOne.mockResolvedValue(mockUser);
            await expect(service.registerCustomer({
                fullName: 'Test User',
                email: 'test@example.com',
                phone: '11999999999',
                password: 'password123',
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('registerDriver', () => {
        it('should create a new driver successfully', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            mockUsersService.create.mockResolvedValue(Object.assign(Object.assign({}, mockUser), { role: 'DRIVER', profileStatus: 'PENDING' }));
            mockMailService.sendWelcomeEmail.mockResolvedValue(undefined);
            const result = await service.registerDriver({
                fullName: 'Test Driver',
                email: 'driver@example.com',
                phone: '11999999999',
                password: 'password123',
                cpf: '12345678901',
                cnh: '12345678901',
                cnhCategory: 'B',
                cnhExpiry: '2025-12-31',
            });
            expect(result.success).toBe(true);
            expect(result.message).toContain('análise');
        });
    });
    describe('checkEmailExists', () => {
        it('should return exists: true when email is registered', async () => {
            mockUsersService.findOne.mockResolvedValue(mockUser);
            const result = await service.checkEmailExists('test@example.com');
            expect(result.exists).toBe(true);
            expect(result.message).toBeDefined();
        });
        it('should return exists: false when email is not registered', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            const result = await service.checkEmailExists('new@example.com');
            expect(result.exists).toBe(false);
        });
        it('should return exists: false for empty email', async () => {
            const result = await service.checkEmailExists('');
            expect(result.exists).toBe(false);
        });
    });
    describe('forgotPassword', () => {
        it('should send reset email when user exists', async () => {
            mockUsersService.findOne.mockResolvedValue(mockUser);
            mockMailService.sendForgotPasswordEmail.mockResolvedValue(undefined);
            const result = await service.forgotPassword('test@example.com');
            expect(result.message).toBeDefined();
            expect(mockMailService.sendForgotPasswordEmail).toHaveBeenCalled();
        });
        it('should return same message even when user does not exist (security)', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            const result = await service.forgotPassword('nonexistent@example.com');
            expect(result.message).toBeDefined();
            expect(mockMailService.sendForgotPasswordEmail).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map