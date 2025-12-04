import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashedpassword',
    role: 'USER',
    profileStatus: 'APPROVED',
    phone: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find a user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashedpassword',
        role: 'USER',
      };
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser, ...createData });

      const result = await service.create(createData);

      expect(result.email).toBe('new@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll('PENDING');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ profileStatus: 'PENDING' }),
        }),
      );
    });

    it('should filter by role', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll(undefined, 'DRIVER');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'DRIVER' }),
        }),
      );
    });

    it('should filter by both status and role', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll('APPROVED', 'DRIVER');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { profileStatus: 'APPROVED', role: 'DRIVER' },
        }),
      );
    });
  });

  describe('approve', () => {
    it('should approve a user', async () => {
      const approvedUser = {
        ...mockUser,
        profileStatus: 'APPROVED',
        approvedAt: expect.any(Date),
        approvedBy: 'admin-1',
      };
      mockPrismaService.user.update.mockResolvedValue(approvedUser);

      const result = await service.approve('1', 'admin-1');

      expect(result.profileStatus).toBe('APPROVED');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          profileStatus: 'APPROVED',
          approvedBy: 'admin-1',
          rejectedAt: null,
          rejectionReason: null,
        }),
      });
    });
  });

  describe('reject', () => {
    it('should reject a user with reason', async () => {
      const rejectedUser = {
        ...mockUser,
        profileStatus: 'REJECTED',
        rejectedAt: expect.any(Date),
        rejectionReason: 'Invalid documents',
      };
      mockPrismaService.user.update.mockResolvedValue(rejectedUser);

      const result = await service.reject('1', 'Invalid documents', 'admin-1');

      expect(result.profileStatus).toBe('REJECTED');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          profileStatus: 'REJECTED',
          rejectionReason: 'Invalid documents',
          approvedAt: null,
          approvedBy: null,
        }),
      });
    });
  });

  describe('countPending', () => {
    it('should return count of pending users', async () => {
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.countPending();

      expect(result.count).toBe(5);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { profileStatus: 'PENDING' },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.userType).toBe('customer');
    });

    it('should return driver userType for DRIVER role', async () => {
      const updatedDriver = { ...mockUser, role: 'DRIVER', name: 'Updated Driver' };
      mockPrismaService.user.update.mockResolvedValue(updatedDriver);

      const result = await service.updateProfile('1', { name: 'Updated Driver' });

      expect(result.userType).toBe('driver');
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by Google ID', async () => {
      const googleUser = { ...mockUser, googleId: 'google-123' };
      mockPrismaService.user.findUnique.mockResolvedValue(googleUser);

      const result = await service.findByGoogleId('google-123');

      expect(result).toEqual(googleUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });
  });

  describe('createFromGoogle', () => {
    it('should create user from Google data', async () => {
      const googleData = {
        googleId: 'google-123',
        email: 'google@example.com',
        name: 'Google User',
        verifiedEmail: true,
      };
      mockPrismaService.user.create.mockResolvedValue({ ...mockUser, ...googleData });

      const result = await service.createFromGoogle(googleData);

      expect(result.googleId).toBe('google-123');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: googleData,
      });
    });
  });
});
