import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma, Vehicle } from '@prisma/client';

@Injectable()
export class VehiclesService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async create(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
        return this.prisma.vehicle.create({ data });
    }

    async findAll(): Promise<Vehicle[]> {
        return this.prisma.vehicle.findMany();
    }

    async findOne(id: string): Promise<Vehicle | null> {
        return this.prisma.vehicle.findUnique({ where: { id } });
    }

    async findByDriver(driverId: string): Promise<Vehicle[]> {
        return this.prisma.vehicle.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminId: string, adminNotes?: string): Promise<Vehicle> {
        // Get vehicle with driver info
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                driver: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        const updatedVehicle = await this.prisma.vehicle.update({
            where: { id },
            data: {
                status,
                approvedBy: adminId,
                approvedAt: new Date(),
                adminNotes: adminNotes || null,
            },
        });

        // Send email notification
        if (vehicle?.driver) {
            try {
                if (status === 'APPROVED') {
                    await this.mailService.sendVehicleApprovedEmail(
                        vehicle.driver.email,
                        vehicle.driver.name,
                        vehicle.model,
                        vehicle.plate,
                        adminNotes,
                    );
                } else {
                    await this.mailService.sendVehicleRejectedEmail(
                        vehicle.driver.email,
                        vehicle.driver.name,
                        vehicle.model,
                        vehicle.plate,
                        adminNotes || 'Motivo nao especificado',
                    );
                }
            } catch (error) {
                console.error('Erro ao enviar email:', error);
            }
        }

        return updatedVehicle;
    }

    async updateOrCreateVehicle(driverId: string, data: {
        brand: string;
        brandLabel?: string;
        model: string;
        modelLabel?: string;
        year: number;
        color?: string;
        plate: string;
        type?: string;
        photo?: string;
        crlvPhoto?: string;
    }): Promise<Vehicle> {
        // Busca o primeiro veículo do motorista
        const existingVehicle = await this.prisma.vehicle.findFirst({
            where: { driverId },
        });

        // Usa o label se disponível, senão usa o value
        const brandDisplay = data.brandLabel || data.brand;
        const modelDisplay = data.modelLabel || data.model;

        // Prepara os dados para atualização/criação
        const vehicleData = {
            plate: data.plate,
            model: `${brandDisplay} ${modelDisplay}`, // Combina marca e modelo para exibição
            capacityKg: 500, // Valor padrão
            capacityM3: 2.0, // Valor padrão
            documents: {
                brand: data.brand, // Value para o select
                brandLabel: brandDisplay, // Label para exibição
                model: data.model, // Value para o select
                modelLabel: modelDisplay, // Label para exibição
                year: data.year,
                color: data.color || '',
                type: data.type || 'CAR',
                photo: data.photo || null,
                crlvPhoto: data.crlvPhoto || null, // Foto do CRLV
            },
        };

        if (existingVehicle) {
            // Atualiza o veículo existente e volta para PENDING (precisa de nova aprovação)
            return this.prisma.vehicle.update({
                where: { id: existingVehicle.id },
                data: {
                    ...vehicleData,
                    status: 'PENDING', // Volta para pendente após alteração
                    approvedBy: null, // Limpa aprovação anterior
                    approvedAt: null, // Limpa data de aprovação
                    adminNotes: null, // Limpa notas do admin
                },
            });
        } else {
            // Cria um novo veículo
            return this.prisma.vehicle.create({
                data: {
                    ...vehicleData,
                    driver: { connect: { id: driverId } },
                    status: 'PENDING', // Novo veículo precisa de aprovação
                },
            });
        }
    }
}
