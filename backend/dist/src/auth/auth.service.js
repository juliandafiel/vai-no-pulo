"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const mail_service_1 = require("../mail/mail.service");
const sms_service_1 = require("../sms/sms.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, mailService, smsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.smsService = smsService;
        this.verificationCodes = new Map();
    }
    async validateUser(email, pass) {
        var _a;
        console.log('[AuthService.validateUser] Tentando login para:', email);
        const user = await this.usersService.findOne(email);
        if (!user) {
            console.log('[AuthService.validateUser] Usuário não encontrado');
            return null;
        }
        console.log('[AuthService.validateUser] Usuário encontrado:', user.id);
        console.log('[AuthService.validateUser] passwordHash existe:', !!user.passwordHash);
        console.log('[AuthService.validateUser] passwordHash:', ((_a = user.passwordHash) === null || _a === void 0 ? void 0 : _a.substring(0, 20)) + '...');
        const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
        console.log('[AuthService.validateUser] Senha válida:', isPasswordValid);
        if (isPasswordValid) {
            const { passwordHash } = user, result = __rest(user, ["passwordHash"]);
            return result;
        }
        return null;
    }
    async login(user) {
        if (user.profileStatus === 'PENDING') {
            throw new common_1.UnauthorizedException({
                statusCode: 401,
                message: 'Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.',
                profileStatus: 'PENDING',
            });
        }
        if (user.profileStatus === 'REJECTED') {
            throw new common_1.UnauthorizedException({
                statusCode: 401,
                message: `Seu cadastro foi rejeitado. Motivo: ${user.rejectionReason || 'Não especificado'}. Entre em contato com o suporte para mais informações.`,
                profileStatus: 'REJECTED',
                rejectionReason: user.rejectionReason,
            });
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        const userType = user.role === 'DRIVER' ? 'driver' : 'customer';
        return {
            access_token: this.jwtService.sign(payload),
            token: this.jwtService.sign(payload),
            user: Object.assign(Object.assign({}, user), { userType }),
        };
    }
    async register(data) {
        const { password } = data, rest = __rest(data, ["password"]);
        return this.usersService.create(Object.assign(Object.assign({}, rest), { passwordHash: password }));
    }
    async forgotPassword(email) {
        const user = await this.usersService.findOne(email);
        if (user) {
            const token = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });
            await this.mailService.sendForgotPasswordEmail(email, token);
        }
        return { message: 'If the email exists, a reset link has been sent.' };
    }
    async sendVerificationCode(email, phone) {
        try {
            const normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
            const normalizedPhone = phone === null || phone === void 0 ? void 0 : phone.replace(/\D/g, '');
            if (!normalizedEmail && !normalizedPhone) {
                throw new common_1.BadRequestException('É necessário fornecer email ou telefone para enviar o código');
            }
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);
            const sentMethods = [];
            const errors = [];
            const identifier = normalizedEmail || normalizedPhone;
            console.log('[DEBUG] Armazenando código com identificador:', identifier);
            console.log('[DEBUG] Email normalizado:', normalizedEmail);
            console.log('[DEBUG] Phone normalizado:', normalizedPhone);
            this.verificationCodes.set(identifier, {
                code,
                expiresAt,
                name: 'Usuário',
                identifier,
            });
            if (normalizedEmail) {
                try {
                    await this.mailService.sendVerificationCode(normalizedEmail, code, 'Usuário');
                    sentMethods.push('e-mail');
                }
                catch (error) {
                    console.error('Erro ao enviar email:', error);
                    errors.push('e-mail');
                }
            }
            if (normalizedPhone) {
                try {
                    if (!this.smsService.isConfigured()) {
                        console.warn('Serviço de SMS não configurado. Pulando envio de SMS.');
                    }
                    else {
                        const formattedPhone = normalizedPhone.startsWith('55') ? `+${normalizedPhone}` : `+55${normalizedPhone}`;
                        await this.smsService.sendVerificationCode(formattedPhone, code, 'Usuário');
                        sentMethods.push('SMS');
                    }
                }
                catch (error) {
                    console.error('Erro ao enviar SMS:', error);
                    errors.push('SMS');
                }
            }
            this.cleanExpiredCodes();
            if (sentMethods.length === 0) {
                throw new common_1.BadRequestException(`Não foi possível enviar o código de verificação. Erros: ${errors.join(', ')}`);
            }
            return {
                success: true,
                message: `Código de verificação enviado via ${sentMethods.join(' e ')}`,
                sentMethods,
                expiresIn: '10 minutos',
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Erro ao enviar código:', error);
            throw new common_1.BadRequestException('Não foi possível enviar o código de verificação');
        }
    }
    async verifyCode(emailOrPhone, code) {
        const isEmail = emailOrPhone.includes('@');
        const normalizedIdentifier = isEmail
            ? emailOrPhone.trim().toLowerCase()
            : emailOrPhone.replace(/\D/g, '');
        console.log('[DEBUG] Buscando código com identificador:', normalizedIdentifier);
        console.log('[DEBUG] É email?', isEmail);
        console.log('[DEBUG] Códigos armazenados:', Array.from(this.verificationCodes.keys()));
        const stored = this.verificationCodes.get(normalizedIdentifier);
        if (!stored) {
            throw new common_1.BadRequestException('Código não encontrado ou expirado');
        }
        if (new Date() > stored.expiresAt) {
            this.verificationCodes.delete(normalizedIdentifier);
            throw new common_1.BadRequestException('Código expirado');
        }
        if (stored.code !== code) {
            throw new common_1.BadRequestException('Código inválido');
        }
        this.verificationCodes.delete(normalizedIdentifier);
        return {
            success: true,
            message: 'Código verificado com sucesso',
        };
    }
    async registerCustomer(data) {
        try {
            const existingUser = await this.usersService.findOne(data.email);
            if (existingUser) {
                throw new common_1.BadRequestException('E-mail já cadastrado');
            }
            const passwordHash = await bcrypt.hash(data.password, 10);
            const user = await this.usersService.create({
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                passwordHash,
                role: 'USER',
                birthDate: data.birthDate,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                documentFront: data.documentFront,
                documentBack: data.documentBack,
                profilePhoto: data.profilePhoto,
            });
            const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
            await this.mailService.sendWelcomeEmail(data.email, data.fullName, 'USER');
            this.verificationCodes.delete(data.email);
            return {
                success: true,
                message: 'Cadastro realizado com sucesso!',
                user: userWithoutPassword,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Erro ao registrar cliente:', error);
            throw new common_1.BadRequestException('Não foi possível completar o cadastro');
        }
    }
    async registerDriver(data) {
        try {
            const existingUser = await this.usersService.findOne(data.email);
            if (existingUser) {
                throw new common_1.BadRequestException('E-mail já cadastrado');
            }
            const passwordHash = await bcrypt.hash(data.password, 10);
            const user = await this.usersService.create({
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                passwordHash,
                role: 'DRIVER',
                cpf: data.cpf,
                rg: data.rg,
                birthDate: data.birthDate,
                cnh: data.cnh,
                cnhCategory: data.cnhCategory,
                cnhExpiry: data.cnhExpiry,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                documentFront: data.documentFront,
                documentBack: data.documentBack,
                profilePhoto: data.profilePhoto,
            });
            const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
            await this.mailService.sendWelcomeEmail(data.email, data.fullName, 'DRIVER');
            return {
                success: true,
                message: 'Cadastro enviado para análise. Você receberá um e-mail em até 48 horas.',
                user: userWithoutPassword,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Erro ao registrar motorista:', error);
            throw new common_1.BadRequestException('Não foi possível completar o cadastro');
        }
    }
    cleanExpiredCodes() {
        const now = new Date();
        for (const [email, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(email);
            }
        }
    }
    async checkEmailExists(email) {
        if (!email || !email.trim()) {
            return { exists: false };
        }
        const user = await this.usersService.findOne(email.trim().toLowerCase());
        return {
            exists: !!user,
            message: user ? 'Este e-mail já está cadastrado' : null,
        };
    }
    async updateDocuments(userId, data) {
        try {
            const updatedUser = await this.usersService.updateById(userId, {
                documentType: data.documentType,
                documentFront: data.documentFront,
                documentBack: data.documentBack,
            });
            return {
                success: true,
                message: 'Documentos atualizados com sucesso',
                user: updatedUser,
            };
        }
        catch (error) {
            console.error('Erro ao atualizar documentos:', error);
            throw new common_1.BadRequestException('Não foi possível atualizar os documentos');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        sms_service_1.SmsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map