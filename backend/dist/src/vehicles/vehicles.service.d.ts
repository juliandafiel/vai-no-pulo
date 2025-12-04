import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma, Vehicle } from '@prisma/client';
export declare class VehiclesService {
    private prisma;
    private mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    create(data: Prisma.VehicleCreateInput): Promise<Vehicle>;
    findAll(): Promise<Vehicle[]>;
    findOne(id: string): Promise<Vehicle | null>;
    findByDriver(driverId: string): Promise<Vehicle[]>;
    updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminId: string, adminNotes?: string): Promise<Vehicle>;
    updateOrCreateVehicle(driverId: string, data: {
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
    }): Promise<Vehicle>;
}
