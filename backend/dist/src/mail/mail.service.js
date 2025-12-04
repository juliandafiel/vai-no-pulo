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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error('Erro ao conectar com Gmail:', error);
            }
            else {
                this.logger.log('Servidor de email pronto para enviar mensagens');
            }
        });
    }
    async sendVerificationCode(email, code, name) {
        try {
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Código de Verificação - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}!</h2>
                            <p style="color: #666; font-size: 16px;">
                                Seu código de verificação é:
                            </p>
                            <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">
                                    ${code}
                                </h1>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Este código expira em 10 minutos.
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                Se você não solicitou este código, ignore este e-mail.
                            </p>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email para ${email}:`, error);
            throw error;
        }
    }
    async sendWelcomeEmail(email, name, userType) {
        try {
            const subject = userType === 'DRIVER'
                ? 'Cadastro Recebido - Análise em Andamento'
                : 'Bem-vindo ao Vai no Pulo!';
            const content = userType === 'DRIVER'
                ? `
                    <p style="color: #666; font-size: 16px;">
                        Recebemos seu cadastro como motorista parceiro!
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Nossa equipe está analisando seus documentos. Você receberá um e-mail de
                        confirmação em até 48 horas úteis.
                    </p>
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px;">
                            <strong>Próximos passos:</strong><br/>
                            1. Aguarde a análise dos documentos<br/>
                            2. Você receberá um e-mail de aprovação<br/>
                            3. Faça login e comece a oferecer trajetos
                        </p>
                    </div>
                `
                : `
                    <p style="color: #666; font-size: 16px;">
                        Seu cadastro foi concluído com sucesso!
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Agora você pode fazer login e começar a enviar suas mercadorias com segurança.
                    </p>
                    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #0c5460; margin: 0; font-size: 14px;">
                            <strong>Próximos passos:</strong><br/>
                            1. Faça login no aplicativo<br/>
                            2. Cadastre endereços favoritos<br/>
                            3. Comece a enviar mercadorias
                        </p>
                    </div>
                `;
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}!</h2>
                            ${content}
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de boas-vindas enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de boas-vindas para ${email}:`, error);
            throw error;
        }
    }
    async sendForgotPasswordEmail(email, token) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Recuperação de Senha - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Recuperação de Senha</h2>
                            <p style="color: #666; font-size: 16px;">
                                Recebemos uma solicitação para redefinir sua senha.
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}"
                                   style="background-color: #667eea; color: white; padding: 15px 30px;
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: bold;">
                                    Redefinir Senha
                                </a>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Este link expira em 1 hora.
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                Se você não solicitou redefinição de senha, ignore este e-mail.
                            </p>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de recuperação enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de recuperação para ${email}:`, error);
            throw error;
        }
    }
    async sendProfileApprovedEmail(email, name) {
        try {
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Cadastro Aprovado - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}!</h2>
                            <p style="color: #666; font-size: 16px;">
                                Seu cadastro foi aprovado! ✅
                            </p>
                            <p style="color: #666; font-size: 14px;">
                                Agora você pode fazer login no aplicativo e começar a usar todos os recursos.
                            </p>
                            <div style="background-color: #d1f2eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                                    <strong>Próximos passos:</strong><br/>
                                    1. Faça login no aplicativo<br/>
                                    2. Complete seu perfil<br/>
                                    3. Comece a aproveitar!
                                </p>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de aprovação enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de aprovação para ${email}:`, error);
            throw error;
        }
    }
    async sendProfileRejectedEmail(email, name, reason) {
        try {
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Cadastro Não Aprovado - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}</h2>
                            <p style="color: #666; font-size: 16px;">
                                Infelizmente, seu cadastro não foi aprovado.
                            </p>
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    <strong>Motivo:</strong><br/>
                                    ${reason}
                                </p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Se você acredita que houve um erro ou deseja mais informações, entre em contato conosco:
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="mailto:suporte@vainopulo.com"
                                   style="background-color: #667eea; color: white; padding: 15px 30px;
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: bold;">
                                    Contatar Suporte
                                </a>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de rejeição enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de rejeição para ${email}:`, error);
            throw error;
        }
    }
    async sendVehicleChangeApprovedEmail(email, name, vehicleModel, vehiclePlate, adminMessage) {
        try {
            const messageSection = adminMessage
                ? `
                    <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <p style="color: #333; margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">
                            Mensagem do Administrador:
                        </p>
                        <p style="color: #555; margin: 0; font-size: 14px;">
                            ${adminMessage}
                        </p>
                    </div>
                `
                : '';
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Alteração de Veículo Aprovada - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}!</h2>
                            <div style="background-color: #d1f2eb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <span style="font-size: 48px;">✅</span>
                                <h3 style="color: #0c5460; margin: 10px 0 0 0;">Alteração Aprovada!</h3>
                            </div>
                            <p style="color: #666; font-size: 16px;">
                                Sua solicitação de alteração do veículo <strong>${vehicleModel}</strong> (Placa: <strong>${vehiclePlate}</strong>) foi aprovada com sucesso!
                            </p>
                            ${messageSection}
                            <p style="color: #666; font-size: 14px;">
                                Os novos dados já estão atualizados no sistema. Você pode verificar as alterações no seu perfil.
                            </p>
                            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                                    <strong>Dica:</strong> Mantenha sempre os documentos do seu veículo atualizados para evitar problemas.
                                </p>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de aprovação de alteração de veículo enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de aprovação de alteração de veículo para ${email}:`, error);
            throw error;
        }
    }
    async sendVehicleChangeRejectedEmail(email, name, vehicleModel, vehiclePlate, reason) {
        try {
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Alteração de Veículo Não Aprovada - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Olá, ${name}</h2>
                            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <span style="font-size: 48px;">❌</span>
                                <h3 style="color: #721c24; margin: 10px 0 0 0;">Alteração Não Aprovada</h3>
                            </div>
                            <p style="color: #666; font-size: 16px;">
                                Sua solicitação de alteração do veículo <strong>${vehicleModel}</strong> (Placa: <strong>${vehiclePlate}</strong>) não foi aprovada.
                            </p>
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    <strong>Motivo:</strong><br/>
                                    ${reason}
                                </p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Você pode fazer uma nova solicitação corrigindo os pontos mencionados acima. Se precisar de ajuda, entre em contato conosco:
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="mailto:suporte@vainopulo.com"
                                   style="background-color: #667eea; color: white; padding: 15px 30px;
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: bold;">
                                    Contatar Suporte
                                </a>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de rejeição de alteração de veículo enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de rejeição de alteração de veículo para ${email}:`, error);
            throw error;
        }
    }
    async sendVehicleApprovedEmail(email, name, vehicleModel, vehiclePlate, adminMessage) {
        try {
            const messageSection = adminMessage
                ? `
                    <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <p style="color: #333; margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">
                            Mensagem do Administrador:
                        </p>
                        <p style="color: #555; margin: 0; font-size: 14px;">
                            ${adminMessage}
                        </p>
                    </div>
                `
                : '';
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Veiculo Aprovado - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Ola, ${name}!</h2>
                            <div style="background-color: #d1f2eb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <span style="font-size: 48px;">✅</span>
                                <h3 style="color: #0c5460; margin: 10px 0 0 0;">Veiculo Aprovado!</h3>
                            </div>
                            <p style="color: #666; font-size: 16px;">
                                Seu veiculo <strong>${vehicleModel}</strong> (Placa: <strong>${vehiclePlate}</strong>) foi aprovado com sucesso!
                            </p>
                            ${messageSection}
                            <p style="color: #666; font-size: 14px;">
                                Agora voce pode comecar a utilizar o sistema e oferecer seus servicos de transporte.
                            </p>
                            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                                    <strong>Proximos passos:</strong><br/>
                                    1. Faca login no aplicativo<br/>
                                    2. Configure suas disponibilidades<br/>
                                    3. Comece a aceitar solicitacoes de transporte
                                </p>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de aprovacao de veiculo enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de aprovacao de veiculo para ${email}:`, error);
            throw error;
        }
    }
    async sendVehicleRejectedEmail(email, name, vehicleModel, vehiclePlate, reason) {
        try {
            const mailOptions = {
                from: `"Vai no Pulo" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: 'Veiculo Nao Aprovado - Vai no Pulo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Vai no Pulo</h1>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h2 style="color: #333;">Ola, ${name}</h2>
                            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <span style="font-size: 48px;">❌</span>
                                <h3 style="color: #721c24; margin: 10px 0 0 0;">Veiculo Nao Aprovado</h3>
                            </div>
                            <p style="color: #666; font-size: 16px;">
                                Seu veiculo <strong>${vehicleModel}</strong> (Placa: <strong>${vehiclePlate}</strong>) nao foi aprovado.
                            </p>
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    <strong>Motivo:</strong><br/>
                                    ${reason}
                                </p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Voce pode fazer um novo cadastro corrigindo os pontos mencionados acima. Se precisar de ajuda, entre em contato conosco:
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="mailto:suporte@vainopulo.com"
                                   style="background-color: #667eea; color: white; padding: 15px 30px;
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: bold;">
                                    Contatar Suporte
                                </a>
                            </div>
                        </div>
                        <div style="background-color: #333; padding: 20px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Vai no Pulo. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de rejeicao de veiculo enviado para ${email}: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email de rejeicao de veiculo para ${email}:`, error);
            throw error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map