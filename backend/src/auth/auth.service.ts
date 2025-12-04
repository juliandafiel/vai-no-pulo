import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
    // Armazena códigos de verificação temporariamente (em produção, use Redis)
    // Agora suporta identificação por email OU phone
    private verificationCodes = new Map<string, { code: string; expiresAt: Date; name: string; identifier: string }>();

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private smsService: SmsService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log('[AuthService.validateUser] Tentando login para:', email);

        const user = await this.usersService.findOne(email);

        if (!user) {
            console.log('[AuthService.validateUser] Usuário não encontrado');
            return null;
        }

        console.log('[AuthService.validateUser] Usuário encontrado:', user.id);
        console.log('[AuthService.validateUser] passwordHash existe:', !!user.passwordHash);
        console.log('[AuthService.validateUser] passwordHash:', user.passwordHash?.substring(0, 20) + '...');

        const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
        console.log('[AuthService.validateUser] Senha válida:', isPasswordValid);

        if (isPasswordValid) {
            const { passwordHash, ...result } = user;
            return result;
        }

        return null;
    }

    async login(user: any) {
        // Verifica o status do perfil
        if (user.profileStatus === 'PENDING') {
            throw new UnauthorizedException({
                statusCode: 401,
                message: 'Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.',
                profileStatus: 'PENDING',
            });
        }

        if (user.profileStatus === 'REJECTED') {
            throw new UnauthorizedException({
                statusCode: 401,
                message: `Seu cadastro foi rejeitado. Motivo: ${user.rejectionReason || 'Não especificado'}. Entre em contato com o suporte para mais informações.`,
                profileStatus: 'REJECTED',
                rejectionReason: user.rejectionReason,
            });
        }

        // Se aprovado, permite o login
        const payload = { email: user.email, sub: user.id, role: user.role };

        // Mapeia role do backend para userType do mobile
        // USER -> customer, DRIVER -> driver
        const userType = user.role === 'DRIVER' ? 'driver' : 'customer';

        return {
            access_token: this.jwtService.sign(payload),
            token: this.jwtService.sign(payload), // Também retorna como 'token' para compatibilidade com o mobile
            user: {
                ...user,
                userType, // Adiciona userType para o mobile
            },
        };
    }

    async register(data: any) {
        const { password, ...rest } = data;
        return this.usersService.create({
            ...rest,
            passwordHash: password,
        });
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOne(email);
        if (user) {
            const token = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });
            await this.mailService.sendForgotPasswordEmail(email, token);
        }
        return { message: 'If the email exists, a reset link has been sent.' };
    }

    async sendVerificationCode(email?: string, phone?: string) {
        try {
            // Normaliza os dados de entrada
            const normalizedEmail = email?.trim().toLowerCase();
            const normalizedPhone = phone?.replace(/\D/g, ''); // Remove formatação do telefone

            // Valida que pelo menos um método foi fornecido
            if (!normalizedEmail && !normalizedPhone) {
                throw new BadRequestException('É necessário fornecer email ou telefone para enviar o código');
            }

            // Gera código de 6 dígitos
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Define expiração de 10 minutos
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const sentMethods: string[] = [];
            const errors: string[] = [];

            // Usa email ou phone como identificador único (normalizado)
            const identifier = normalizedEmail || normalizedPhone;

            console.log('[DEBUG] Armazenando código com identificador:', identifier);
            console.log('[DEBUG] Email normalizado:', normalizedEmail);
            console.log('[DEBUG] Phone normalizado:', normalizedPhone);

            // Armazena o código temporariamente
            this.verificationCodes.set(identifier, {
                code,
                expiresAt,
                name: 'Usuário', // Será atualizado no registro
                identifier,
            });

            // Tenta enviar por e-mail se fornecido
            if (normalizedEmail) {
                try {
                    await this.mailService.sendVerificationCode(normalizedEmail, code, 'Usuário');
                    sentMethods.push('e-mail');
                } catch (error) {
                    console.error('Erro ao enviar email:', error);
                    errors.push('e-mail');
                }
            }

            // Tenta enviar por SMS se fornecido
            if (normalizedPhone) {
                try {
                    if (!this.smsService.isConfigured()) {
                        console.warn('Serviço de SMS não configurado. Pulando envio de SMS.');
                    } else {
                        // Formata para o padrão internacional antes de enviar
                        const formattedPhone = normalizedPhone.startsWith('55') ? `+${normalizedPhone}` : `+55${normalizedPhone}`;
                        await this.smsService.sendVerificationCode(formattedPhone, code, 'Usuário');
                        sentMethods.push('SMS');
                    }
                } catch (error) {
                    console.error('Erro ao enviar SMS:', error);
                    errors.push('SMS');
                }
            }

            // Limpa códigos expirados a cada envio
            this.cleanExpiredCodes();

            // Verifica se pelo menos um método teve sucesso
            if (sentMethods.length === 0) {
                throw new BadRequestException(
                    `Não foi possível enviar o código de verificação. Erros: ${errors.join(', ')}`
                );
            }

            return {
                success: true,
                message: `Código de verificação enviado via ${sentMethods.join(' e ')}`,
                sentMethods,
                expiresIn: '10 minutos',
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Erro ao enviar código:', error);
            throw new BadRequestException('Não foi possível enviar o código de verificação');
        }
    }

    async verifyCode(emailOrPhone: string, code: string) {
        // Normaliza o identificador da mesma forma que no envio
        // Se parece com email, normaliza como email; senão, como telefone
        const isEmail = emailOrPhone.includes('@');
        const normalizedIdentifier = isEmail
            ? emailOrPhone.trim().toLowerCase()
            : emailOrPhone.replace(/\D/g, '');

        console.log('[DEBUG] Buscando código com identificador:', normalizedIdentifier);
        console.log('[DEBUG] É email?', isEmail);
        console.log('[DEBUG] Códigos armazenados:', Array.from(this.verificationCodes.keys()));

        const stored = this.verificationCodes.get(normalizedIdentifier);

        if (!stored) {
            throw new BadRequestException('Código não encontrado ou expirado');
        }

        if (new Date() > stored.expiresAt) {
            this.verificationCodes.delete(normalizedIdentifier);
            throw new BadRequestException('Código expirado');
        }

        if (stored.code !== code) {
            throw new BadRequestException('Código inválido');
        }

        // Limpa o código após verificação bem-sucedida
        this.verificationCodes.delete(normalizedIdentifier);

        return {
            success: true,
            message: 'Código verificado com sucesso',
        };
    }

    async registerCustomer(data: any) {
        try {
            // Verifica se o email já existe
            const existingUser = await this.usersService.findOne(data.email);
            if (existingUser) {
                throw new BadRequestException('E-mail já cadastrado');
            }

            // Hash da senha
            const passwordHash = await bcrypt.hash(data.password, 10);

            // Cria o usuário com todos os campos incluindo documentos
            const user = await this.usersService.create({
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                passwordHash,
                role: 'USER',
                // Campos de documentos
                birthDate: data.birthDate,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                documentFront: data.documentFront,
                documentBack: data.documentBack,
                profilePhoto: data.profilePhoto,
            });

            // Remove a senha do retorno
            const { passwordHash: _, ...userWithoutPassword } = user;

            // Envia email de boas-vindas
            await this.mailService.sendWelcomeEmail(data.email, data.fullName, 'USER');

            // Remove o código de verificação (usa email como identificador)
            this.verificationCodes.delete(data.email);

            return {
                success: true,
                message: 'Cadastro realizado com sucesso!',
                user: userWithoutPassword,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Erro ao registrar cliente:', error);
            throw new BadRequestException('Não foi possível completar o cadastro');
        }
    }

    async registerDriver(data: any) {
        try {
            // Verifica se o email já existe
            const existingUser = await this.usersService.findOne(data.email);
            if (existingUser) {
                throw new BadRequestException('E-mail já cadastrado');
            }

            // Hash da senha
            const passwordHash = await bcrypt.hash(data.password, 10);

            // Cria o usuário com todos os campos incluindo documentos
            const user = await this.usersService.create({
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                passwordHash,
                role: 'DRIVER',
                // Campos do motorista
                cpf: data.cpf,
                rg: data.rg,
                birthDate: data.birthDate,
                cnh: data.cnh,
                cnhCategory: data.cnhCategory,
                cnhExpiry: data.cnhExpiry,
                // Campos de documentos
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                documentFront: data.documentFront,
                documentBack: data.documentBack,
                profilePhoto: data.profilePhoto,
            });

            // Remove a senha do retorno
            const { passwordHash: _, ...userWithoutPassword } = user;

            // Envia email de boas-vindas (cadastro em análise)
            await this.mailService.sendWelcomeEmail(data.email, data.fullName, 'DRIVER');

            return {
                success: true,
                message: 'Cadastro enviado para análise. Você receberá um e-mail em até 48 horas.',
                user: userWithoutPassword,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Erro ao registrar motorista:', error);
            throw new BadRequestException('Não foi possível completar o cadastro');
        }
    }

    private cleanExpiredCodes() {
        const now = new Date();
        for (const [email, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(email);
            }
        }
    }

    async checkEmailExists(email: string) {
        if (!email || !email.trim()) {
            return { exists: false };
        }

        const user = await this.usersService.findOne(email.trim().toLowerCase());
        return {
            exists: !!user,
            message: user ? 'Este e-mail já está cadastrado' : null,
        };
    }

    async updateDocuments(
        userId: string,
        data: { documentType: string; documentFront: string; documentBack: string },
    ) {
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
        } catch (error) {
            console.error('Erro ao atualizar documentos:', error);
            throw new BadRequestException('Não foi possível atualizar os documentos');
        }
    }
}
