import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoutesService } from '../routes/routes.service';
import { BadRequestException } from '@nestjs/common';

describe('TripsService', () => {
  let service: TripsService;
  let prismaService: PrismaService;

  const mockTrip = {
    id: '1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    originName: 'Sao Paulo, SP',
    originLat: -23.5505,
    originLng: -46.6333,
    destName: 'Campinas, SP',
    destLat: -22.9099,
    destLng: -47.0626,
    departureAt: new Date('2024-01-15T08:00:00Z'),
    estimatedArrival: new Date('2024-01-15T10:00:00Z'),
    distanceKm: 100,
    durationMinutes: 120,
    availableSeats: 3,
    availableCapacityKg: 50,
    status: 'SCHEDULED',
    notes: null,
    lastLocation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    trip: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    vehicle: {
      findFirst: jest.fn(),
    },
  };

  const mockRoutesService = {
    calculateRoute: jest.fn().mockResolvedValue({
      distanceKm: 100,
      durationMinutes: 120,
      estimatedArrival: new Date('2024-01-15T10:00:00Z'),
    }),
    getWazeNavigationUrl: jest.fn().mockReturnValue('https://waze.com/ul?ll=-22.9099,-47.0626'),
    getGoogleMapsNavigationUrl: jest.fn().mockReturnValue('https://google.com/maps?saddr=-23.5505,-46.6333&daddr=-22.9099,-47.0626'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RoutesService, useValue: mockRoutesService },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new trip with provided vehicleId', async () => {
      const createData = {
        originName: 'Sao Paulo, SP',
        originLat: -23.5505,
        originLng: -46.6333,
        destName: 'Campinas, SP',
        destLat: -22.9099,
        destLng: -47.0626,
        departureAt: '2024-02-01T10:00:00Z',
        availableSeats: 3,
        availableCapacityKg: 50,
        vehicleId: 'vehicle-1', // Provide vehicleId to skip vehicle lookup
      };

      mockPrismaService.trip.create.mockResolvedValue({
        ...mockTrip,
        ...createData,
      });

      const result = await service.create(createData, 'driver-1');

      expect(result.originName).toBe('Sao Paulo, SP');
      expect(mockPrismaService.trip.create).toHaveBeenCalled();
    });

    it('should throw error if no approved vehicle and no pending vehicle', async () => {
      jest.clearAllMocks();

      const createData = {
        originName: 'Sao Paulo, SP',
        originLat: -23.5505,
        originLng: -46.6333,
        destName: 'Campinas, SP',
        destLat: -22.9099,
        destLng: -47.0626,
        departureAt: '2024-02-01T10:00:00Z',
      };

      // Reset and setup mock for this specific test
      mockPrismaService.vehicle.findFirst.mockReset();
      mockPrismaService.vehicle.findFirst
        .mockResolvedValueOnce(null) // First call: No approved vehicle
        .mockResolvedValueOnce(null); // Second call: No pending vehicle

      // Re-mock routesService since it's called first
      mockRoutesService.calculateRoute.mockResolvedValue({
        distanceKm: 100,
        durationMinutes: 120,
        estimatedArrival: new Date('2024-01-15T10:00:00Z'),
      });

      await expect(service.create(createData, 'driver-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all trips with query', async () => {
      mockPrismaService.trip.findMany.mockResolvedValue([mockTrip]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.trip.findMany.mockResolvedValue([mockTrip]);

      await service.findAll({ status: 'SCHEDULED' });

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SCHEDULED' }),
        }),
      );
    });

    it('should filter by driver', async () => {
      mockPrismaService.trip.findMany.mockResolvedValue([mockTrip]);

      await service.findAll({ driverId: 'driver-1' });

      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: 'driver-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should find a trip by id', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);

      const result = await service.findOne('1');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('1');
    });

    it('should return null when trip not found', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('findByDriver', () => {
    it('should find trips by driver id', async () => {
      mockPrismaService.trip.findMany.mockResolvedValue([mockTrip]);

      const result = await service.findByDriver('driver-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: 'driver-1' },
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update trip status to ACTIVE', async () => {
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'ACTIVE',
      });

      const result = await service.updateStatus('1', 'ACTIVE');

      expect(result.status).toBe('ACTIVE');
    });

    it('should update trip status to COMPLETED', async () => {
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'COMPLETED',
      });

      const result = await service.updateStatus('1', 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
    });

    it('should update trip status to CANCELLED', async () => {
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'CANCELLED',
      });

      const result = await service.updateStatus('1', 'CANCELLED');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('updateLocation', () => {
    it('should update trip location', async () => {
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        lastLocation: { lat: -23.0, lng: -46.5, ts: expect.any(Date) },
      });

      const result = await service.updateLocation('1', -23.0, -46.5);

      expect(result.lastLocation).toBeTruthy();
    });
  });

  describe('startTrip', () => {
    it('should start a scheduled trip', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'ACTIVE',
      });

      const result = await service.startTrip('1', 'driver-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw error if not the driver', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(service.startTrip('1', 'other-driver')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if trip not scheduled', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'ACTIVE',
      });

      await expect(service.startTrip('1', 'driver-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeTrip', () => {
    it('should complete an active trip', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'ACTIVE',
      });
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'COMPLETED',
      });

      const result = await service.completeTrip('1', 'driver-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw error if trip not active', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(service.completeTrip('1', 'driver-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a scheduled trip', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.trip.update.mockResolvedValue({
        ...mockTrip,
        status: 'CANCELLED',
      });

      const result = await service.cancelTrip('1', 'driver-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw error if trip already completed', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'COMPLETED',
      });

      await expect(service.cancelTrip('1', 'driver-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a trip', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.trip.delete.mockResolvedValue(mockTrip);

      const result = await service.delete('1', 'driver-1');

      expect(result).toEqual(mockTrip);
    });

    it('should throw error if trip is active', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'ACTIVE',
      });

      await expect(service.delete('1', 'driver-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if not the driver', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(service.delete('1', 'other-driver')).rejects.toThrow(BadRequestException);
    });
  });
});
