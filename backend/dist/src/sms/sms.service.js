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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const twilio = require("twilio");
let SmsService = SmsService_1 = class SmsService {
    constructor() {
        this.logger = new common_1.Logger(SmsService_1.name);
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken || !this.fromNumber) {
            this.logger.warn('Credenciais do Twilio não configuradas. SMS será desabilitado.');
            return;
        }
        try {
            this.client = twilio(accountSid, authToken);
            this.logger.log('Cliente Twilio configurado com sucesso');
        }
        catch (error) {
            this.logger.error('Erro ao configurar cliente Twilio:', error);
        }
    }
    async sendVerificationCode(phone, code, name) {
        if (!this.client) {
            this.logger.warn('Cliente Twilio não configurado. SMS não enviado.');
            return false;
        }
        try {
            const message = await this.client.messages.create({
                body: `Olá ${name}! Seu código de verificação Vai no Pulo é: ${code}. Expira em 10 minutos.`,
                from: this.fromNumber,
                to: phone,
            });
            this.logger.log(`SMS enviado para ${phone}: ${message.sid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar SMS para ${phone}:`, error);
            throw error;
        }
    }
    isConfigured() {
        return !!this.client;
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsService);
//# sourceMappingURL=sms.service.js.map