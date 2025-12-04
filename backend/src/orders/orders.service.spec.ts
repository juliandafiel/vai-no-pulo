import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createData = {
        tripId: 'trip-1',
        description: 'Package delivery',
        weight: 5,
        estimatedPrice: 50,
      };

      const mockTrip = {
        id: 'trip-1',
        driverId: 'driver-1',
        driver: { id: 'driver-1', name: 'Driver' },
      };

      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        tripId: 'trip-1',
        description: 'Package delivery',
        weight: 5,
        estimatedPrice: 50,
        status: 'PENDING',
        customer: { id: 'customer-1', name: 'Customer', phone: '11999999999', profilePhoto: null },
        driver: { id: 'driver-1', name: 'Driver', phone: '11888888888', profilePhoto: null },
        trip: { id: 'trip-1', originName: 'Origin', destName: 'Dest', departureAt: new Date() },
      };

      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.create(createData, 'customer-1');

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trip not found', async () => {
      mockPrismaService.trip.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ tripId: 'invalid', description: 'Test', weight: 5, estimatedPrice: 50 }, 'customer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if customer is the driver', async () => {
      const mockTrip = { id: 'trip-1', driverId: 'driver-1' };
      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(
        service.create({ tripId: 'trip-1', description: 'Test', weight: 5, estimatedPrice: 50 }, 'driver-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if customer already has pending order', async () => {
      const mockTrip = { id: 'trip-1', driverId: 'driver-1' };
      const existingOrder = { id: 'existing-1', status: 'PENDING' };

      mockPrismaService.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrismaService.order.findFirst.mockResolvedValue(existingOrder);

      await expect(
        service.create({ tripId: 'trip-1', description: 'Test', weight: 5, estimatedPrice: 50 }, 'customer-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyOrders', () => {
    it('should return orders for customer', async () => {
      const mockOrders = [
        {
          id: '1',
          status: 'PENDING',
          createdAt: new Date(),
          tripId: 'trip-1',
          description: 'Package',
          weight: 5,
          estimatedPrice: 50,
          notes: null,
          trip: { originName: 'Origin', destName: 'Dest', departureAt: new Date() },
          customer: { id: 'customer-1', name: 'Customer', phone: '11999999999', profilePhoto: null },
          driver: { id: 'driver-1', name: 'Driver', phone: '11888888888', profilePhoto: null },
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findMyOrders('customer-1', 'CUSTOMER');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'customer-1' },
        }),
      );
    });

    it('should return orders for driver', async () => {
      const mockOrders = [
        {
          id: '1',
          status: 'ACCEPTED',
          createdAt: new Date(),
          tripId: 'trip-1',
          description: 'Package',
          weight: 5,
          estimatedPrice: 50,
          notes: null,
          trip: { originName: 'Origin', destName: 'Dest', departureAt: new Date() },
          customer: { id: 'customer-1', name: 'Customer', phone: '11999999999', profilePhoto: null },
          driver: { id: 'driver-1', name: 'Driver', phone: '11888888888', profilePhoto: null },
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findMyOrders('driver-1', 'DRIVER');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: 'driver-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should find an order by id', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        status: 'PENDING',
        customer: { id: 'customer-1', name: 'Customer' },
        driver: { id: 'driver-1', name: 'Driver' },
        trip: {},
        messages: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('1', 'customer-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999', 'customer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not authorized', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.findOne('1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('accept', () => {
    it('should accept a pending order', async () => {
      const mockOrder = {
        id: '1',
        driverId: 'driver-1',
        status: 'PENDING',
      };

      const updatedOrder = { ...mockOrder, status: 'ACCEPTED', acceptedAt: new Date() };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.accept('1', 'driver-1');

      expect(result.status).toBe('ACCEPTED');
    });

    it('should throw ForbiddenException if not the driver', async () => {
      const mockOrder = { id: '1', driverId: 'driver-1', status: 'PENDING' };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.accept('1', 'other-driver')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order not pending', async () => {
      const mockOrder = { id: '1', driverId: 'driver-1', status: 'ACCEPTED' };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.accept('1', 'driver-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject a pending order', async () => {
      const mockOrder = {
        id: '1',
        driverId: 'driver-1',
        status: 'PENDING',
      };

      const updatedOrder = { ...mockOrder, status: 'REJECTED' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.reject('1', 'driver-1', 'No available space');

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order by customer', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        status: 'PENDING',
      };

      const updatedOrder = { ...mockOrder, status: 'CANCELLED' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.cancel('1', 'customer-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should cancel an accepted order by driver', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        status: 'ACCEPTED',
      };

      const updatedOrder = { ...mockOrder, status: 'CANCELLED' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.cancel('1', 'driver-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException if order in progress', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        driverId: 'driver-1',
        status: 'IN_PROGRESS',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancel('1', 'customer-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('startProgress', () => {
    it('should start progress on accepted order', async () => {
      const mockOrder = {
        id: '1',
        driverId: 'driver-1',
        status: 'ACCEPTED',
      };

      const updatedOrder = { ...mockOrder, status: 'IN_PROGRESS' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.startProgress('1', 'driver-1');

      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('complete', () => {
    it('should complete an in-progress order', async () => {
      const mockOrder = {
        id: '1',
        driverId: 'driver-1',
        status: 'IN_PROGRESS',
        estimatedPrice: 50,
      };

      const updatedOrder = { ...mockOrder, status: 'COMPLETED', finalPrice: 50 };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.complete('1', 'driver-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should complete with custom final price', async () => {
      const mockOrder = {
        id: '1',
        driverId: 'driver-1',
        status: 'IN_PROGRESS',
        estimatedPrice: 50,
      };

      const updatedOrder = { ...mockOrder, status: 'COMPLETED', finalPrice: 60 };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.complete('1', 'driver-1', 60);

      expect(result.finalPrice).toBe(60);
    });
  });

  describe('countPendingOrders', () => {
    it('should count pending orders for driver', async () => {
      mockPrismaService.order.count.mockResolvedValue(5);

      const result = await service.countPendingOrders('driver-1', 'DRIVER');

      expect(result).toBe(5);
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: { driverId: 'driver-1', status: 'PENDING' },
      });
    });

    it('should count pending orders for customer', async () => {
      mockPrismaService.order.count.mockResolvedValue(3);

      const result = await service.countPendingOrders('customer-1', 'CUSTOMER');

      expect(result).toBe(3);
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', status: 'PENDING' },
      });
    });
  });
});
