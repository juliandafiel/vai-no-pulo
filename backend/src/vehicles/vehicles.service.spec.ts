import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prismaService: PrismaService;
  let mailService: MailService;

  const mockVehicle = {
    id: '1',
    plate: 'ABC1234',
    model: 'Toyota Corolla',
    capacityKg: 500,
    capacityM3: 2.0,
    status: 'PENDING',
    driverId: 'driver-1',
    documents: {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'Prata',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDriver = {
    id: 'driver-1',
    name: 'Test Driver',
    email: 'driver@example.com',
  };

  const mockPrismaService = {
    vehicle: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMailService = {
    sendVehicleApprovedEmail: jest.fn(),
    sendVehicleRejectedEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      const createData = {
        plate: 'XYZ5678',
        model: 'Honda Civic',
        capacityKg: 400,
        capacityM3: 1.5,
        driver: { connect: { id: 'driver-1' } },
        documents: {
          brand: 'Honda',
          model: 'Civic',
          year: 2023,
          color: 'Branco',
        },
      };
      mockPrismaService.vehicle.create.mockResolvedValue({
        ...mockVehicle,
        ...createData,
      });

      const result = await service.create(createData);

      expect(result.plate).toBe('XYZ5678');
      expect(mockPrismaService.vehicle.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      mockPrismaService.vehicle.findMany.mockResolvedValue([mockVehicle]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].plate).toBe('ABC1234');
    });
  });

  describe('findOne', () => {
    it('should find a vehicle by id', async () => {
      mockPrismaService.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.findOne('1');

      expect(result).toEqual(mockVehicle);
      expect(mockPrismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when vehicle not found', async () => {
      mockPrismaService.vehicle.findUnique.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('findByDriver', () => {
    it('should find vehicles by driver id', async () => {
      mockPrismaService.vehicle.findMany.mockResolvedValue([mockVehicle]);

      const result = await service.findByDriver('driver-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: { driverId: 'driver-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should approve a vehicle and send email', async () => {
      const vehicleWithDriver = {
        ...mockVehicle,
        driver: mockDriver,
      };
      mockPrismaService.vehicle.findUnique.mockResolvedValue(vehicleWithDriver);
      mockPrismaService.vehicle.update.mockResolvedValue({
        ...mockVehicle,
        status: 'APPROVED',
      });
      mockMailService.sendVehicleApprovedEmail.mockResolvedValue(undefined);

      const result = await service.updateStatus('1', 'APPROVED', 'admin-1', 'Approved!');

      expect(result.status).toBe('APPROVED');
      expect(mockMailService.sendVehicleApprovedEmail).toHaveBeenCalledWith(
        'driver@example.com',
        'Test Driver',
        'Toyota Corolla',
        'ABC1234',
        'Approved!',
      );
    });

    it('should reject a vehicle and send email', async () => {
      const vehicleWithDriver = {
        ...mockVehicle,
        driver: mockDriver,
      };
      mockPrismaService.vehicle.findUnique.mockResolvedValue(vehicleWithDriver);
      mockPrismaService.vehicle.update.mockResolvedValue({
        ...mockVehicle,
        status: 'REJECTED',
      });
      mockMailService.sendVehicleRejectedEmail.mockResolvedValue(undefined);

      const result = await service.updateStatus('1', 'REJECTED', 'admin-1', 'Documents unclear');

      expect(result.status).toBe('REJECTED');
      expect(mockMailService.sendVehicleRejectedEmail).toHaveBeenCalledWith(
        'driver@example.com',
        'Test Driver',
        'Toyota Corolla',
        'ABC1234',
        'Documents unclear',
      );
    });

    it('should handle email sending errors gracefully', async () => {
      const vehicleWithDriver = {
        ...mockVehicle,
        driver: mockDriver,
      };
      mockPrismaService.vehicle.findUnique.mockResolvedValue(vehicleWithDriver);
      mockPrismaService.vehicle.update.mockResolvedValue({
        ...mockVehicle,
        status: 'APPROVED',
      });
      mockMailService.sendVehicleApprovedEmail.mockRejectedValue(new Error('Email failed'));

      // Should not throw, just log the error
      const result = await service.updateStatus('1', 'APPROVED', 'admin-1');

      expect(result.status).toBe('APPROVED');
    });
  });

  describe('updateOrCreateVehicle', () => {
    const vehicleData = {
      brand: 'toyota',
      brandLabel: 'Toyota',
      model: 'corolla',
      modelLabel: 'Corolla',
      year: 2022,
      color: 'Prata',
      plate: 'ABC1234',
      type: 'CAR',
      photo: 'http://example.com/photo.jpg',
    };

    it('should create a new vehicle if none exists', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicle.create.mockResolvedValue({
        ...mockVehicle,
        status: 'PENDING',
      });

      const result = await service.updateOrCreateVehicle('driver-1', vehicleData);

      expect(result.status).toBe('PENDING');
      expect(mockPrismaService.vehicle.create).toHaveBeenCalled();
    });

    it('should update existing vehicle and reset status to PENDING', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.vehicle.update.mockResolvedValue({
        ...mockVehicle,
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
      });

      const result = await service.updateOrCreateVehicle('driver-1', vehicleData);

      expect(result.status).toBe('PENDING');
      expect(result.approvedBy).toBeNull();
      expect(mockPrismaService.vehicle.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: 'PENDING',
          approvedBy: null,
          approvedAt: null,
          adminNotes: null,
        }),
      });
    });

    it('should use label values for model display', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicle.create.mockResolvedValue(mockVehicle);

      await service.updateOrCreateVehicle('driver-1', vehicleData);

      expect(mockPrismaService.vehicle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          model: 'Toyota Corolla', // Should combine brand and model labels
        }),
      });
    });

    it('should use value when label is not provided', async () => {
      const dataWithoutLabels = {
        brand: 'ford',
        model: 'focus',
        year: 2021,
        plate: 'XYZ9999',
      };
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicle.create.mockResolvedValue(mockVehicle);

      await service.updateOrCreateVehicle('driver-1', dataWithoutLabels);

      expect(mockPrismaService.vehicle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          model: 'ford focus', // Should use values when labels not provided
        }),
      });
    });
  });
});
