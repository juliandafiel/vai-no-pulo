import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
    private client;
    private readonly logger = new Logger(SmsService.name);
    private readonly fromNumber: string;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !this.fromNumber) {
            this.logger.warn(
                'Credenciais do Twilio não configuradas. SMS será desabilitado.'
            );
            return;
        }

        try {
            this.client = twilio(accountSid, authToken);
            this.logger.log('Cliente Twilio configurado com sucesso');
        } catch (error) {
            this.logger.error('Erro ao configurar cliente Twilio:', error);
        }
    }

    async sendVerificationCode(phone: string, code: string, name: string): Promise<boolean> {
        if (!this.client) {
            this.logger.warn('Cliente Twilio não configurado. SMS não enviado.');
            return false;
        }

        try {
            // O phone já vem formatado do auth.service, apenas usa como está
            const message = await this.client.messages.create({
                body: `Olá ${name}! Seu código de verificação Vai no Pulo é: ${code}. Expira em 10 minutos.`,
                from: this.fromNumber,
                to: phone,
            });

            this.logger.log(`SMS enviado para ${phone}: ${message.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Erro ao enviar SMS para ${phone}:`, error);
            throw error;
        }
    }

    isConfigured(): boolean {
        return !!this.client;
    }
}
