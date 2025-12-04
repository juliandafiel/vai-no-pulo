import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { VehicleChangeRequestStatus } from '@prisma/client';

interface CreateChangeRequestDto {
    vehicleId: string;
    newPlate?: string;
    newModel?: string;
    newBrand?: string;
    newYear?: string;
    newColor?: string;
    newCapacityKg?: number;
    newCapacityM3?: number;
    newDocuments?: any;
    newVehiclePhoto?: string;
}

interface ReviewChangeRequestDto {
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    adminMessage?: string;
}

@Injectable()
export class VehicleChangeRequestService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    // Criar solicitação de alteração
    async create(driverId: string, data: CreateChangeRequestDto) {
        // Verificar se o veículo existe e pertence ao motorista
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: data.vehicleId,
                driverId: driverId,
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Veículo não encontrado ou não pertence a você');
        }

        // Verificar se já existe uma solicitação pendente
        const existingRequest = await this.prisma.vehicleChangeRequest.findFirst({
            where: {
                vehicleId: data.vehicleId,
                status: 'PENDING',
            },
        });

        if (existingRequest) {
            throw new BadRequestException('Já existe uma solicitação de alteração pendente para este veículo');
        }

        // Criar a solicitação
        const changeRequest = await this.prisma.vehicleChangeRequest.create({
            data: {
                vehicleId: data.vehicleId,
                driverId: driverId,
                newPlate: data.newPlate,
                newModel: data.newModel,
                newBrand: data.newBrand,
                newYear: data.newYear,
                newColor: data.newColor,
                newCapacityKg: data.newCapacityKg,
                newCapacityM3: data.newCapacityM3,
                newDocuments: data.newDocuments,
                newVehiclePhoto: data.newVehiclePhoto,
            },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Marcar veículo como tendo alteração pendente
        await this.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: { hasPendingChange: true },
        });

        return changeRequest;
    }

    // Listar solicitações do motorista
    async findByDriver(driverId: string) {
        return this.prisma.vehicleChangeRequest.findMany({
            where: { driverId },
            include: {
                vehicle: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Listar todas as solicitações pendentes (Admin)
    async findAllPending() {
        return this.prisma.vehicleChangeRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Listar todas as solicitações (Admin)
    async findAll(status?: VehicleChangeRequestStatus) {
        return this.prisma.vehicleChangeRequest.findMany({
            where: status ? { status } : undefined,
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Obter uma solicitação específica
    async findOne(id: string) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profilePhoto: true,
                    },
                },
            },
        });

        if (!request) {
            throw new NotFoundException('Solicitação não encontrada');
        }

        return request;
    }

    // Aprovar ou rejeitar solicitação (Admin)
    async review(id: string, adminId: string, data: ReviewChangeRequestDto) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!request) {
            throw new NotFoundException('Solicitação não encontrada');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException('Esta solicitação já foi processada');
        }

        if (data.status === 'REJECTED' && !data.rejectionReason) {
            throw new BadRequestException('Motivo da rejeição é obrigatório');
        }

        // Atualizar a solicitação
        const updatedRequest = await this.prisma.vehicleChangeRequest.update({
            where: { id },
            data: {
                status: data.status,
                rejectionReason: data.rejectionReason,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        // Se aprovado, atualizar o veículo
        if (data.status === 'APPROVED') {
            const updateData: any = {};

            if (request.newPlate) updateData.plate = request.newPlate;
            if (request.newModel) updateData.model = request.newModel;
            if (request.newBrand) updateData.brand = request.newBrand;
            if (request.newYear) updateData.year = request.newYear;
            if (request.newColor) updateData.color = request.newColor;
            if (request.newCapacityKg !== null) updateData.capacityKg = request.newCapacityKg;
            if (request.newCapacityM3 !== null) updateData.capacityM3 = request.newCapacityM3;
            if (request.newDocuments) updateData.documents = request.newDocuments;
            if (request.newVehiclePhoto) updateData.vehiclePhoto = request.newVehiclePhoto;

            await this.prisma.vehicle.update({
                where: { id: request.vehicleId },
                data: {
                    ...updateData,
                    hasPendingChange: false,
                },
            });

            // Enviar email de aprovação
            try {
                await this.mailService.sendVehicleChangeApprovedEmail(
                    request.driver.email,
                    request.driver.name,
                    request.vehicle.model,
                    request.vehicle.plate,
                    data.adminMessage,
                );
            } catch (error) {
                console.error('Erro ao enviar email de aprovação:', error);
            }
        } else {
            // Remover flag de alteração pendente
            await this.prisma.vehicle.update({
                where: { id: request.vehicleId },
                data: { hasPendingChange: false },
            });

            // Enviar email de rejeição
            try {
                await this.mailService.sendVehicleChangeRejectedEmail(
                    request.driver.email,
                    request.driver.name,
                    request.vehicle.model,
                    request.vehicle.plate,
                    data.rejectionReason!,
                );
            } catch (error) {
                console.error('Erro ao enviar email de rejeição:', error);
            }
        }

        return updatedRequest;
    }

    // Cancelar solicitação (motorista pode cancelar apenas se estiver pendente)
    async cancel(id: string, driverId: string) {
        const request = await this.prisma.vehicleChangeRequest.findUnique({
            where: { id },
        });

        if (!request) {
            throw new NotFoundException('Solicitação não encontrada');
        }

        if (request.driverId !== driverId) {
            throw new ForbiddenException('Você não tem permissão para cancelar esta solicitação');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException('Apenas solicitações pendentes podem ser canceladas');
        }

        // Remover flag de alteração pendente
        await this.prisma.vehicle.update({
            where: { id: request.vehicleId },
            data: { hasPendingChange: false },
        });

        // Deletar a solicitação
        await this.prisma.vehicleChangeRequest.delete({
            where: { id },
        });

        return { message: 'Solicitação cancelada com sucesso' };
    }

    // Verificar se veículo tem solicitação pendente
    async hasPendingRequest(vehicleId: string): Promise<boolean> {
        const request = await this.prisma.vehicleChangeRequest.findFirst({
            where: {
                vehicleId,
                status: 'PENDING',
            },
        });

        return !!request;
    }
}
