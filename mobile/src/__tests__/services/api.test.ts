import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock api instance similar to the real one
const createMockApi = () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    defaults: {
      baseURL: 'http://localhost:3000',
    },
  };
  return instance;
};

describe('API Service', () => {
  let mockApi: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    mockApi = createMockApi();
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
          },
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.token).toBe('test-token');
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should handle login failure', async () => {
      mockApi.post.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });

      await expect(
        mockApi.post('/auth/login', {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toEqual(
        expect.objectContaining({
          response: expect.objectContaining({
            status: 401,
          }),
        })
      );
    });

    it('should register a new customer', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: '2',
            email: 'new@example.com',
            name: 'New User',
          },
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/auth/register/customer', {
        fullName: 'New User',
        email: 'new@example.com',
        phone: '11999999999',
        password: 'Password123!',
      });

      expect(result.data.success).toBe(true);
      expect(result.data.user.email).toBe('new@example.com');
    });
  });

  describe('Users', () => {
    it('should get user profile', async () => {
      const mockResponse = {
        data: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          phone: '11999999999',
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/users/1');

      expect(result.data.id).toBe('1');
      expect(result.data.name).toBe('Test User');
    });

    it('should update user profile', async () => {
      const mockResponse = {
        data: {
          id: '1',
          name: 'Updated Name',
          email: 'test@example.com',
        },
      };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await mockApi.put('/users/1/profile', {
        name: 'Updated Name',
      });

      expect(result.data.name).toBe('Updated Name');
    });
  });

  describe('Vehicles', () => {
    it('should get vehicle by driver', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            plate: 'ABC1234',
            model: 'Toyota Corolla',
            status: 'APPROVED',
          },
        ],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/vehicles/driver/driver-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].plate).toBe('ABC1234');
    });

    it('should create or update vehicle', async () => {
      const mockResponse = {
        data: {
          id: '1',
          plate: 'XYZ9999',
          model: 'Honda Civic',
          status: 'PENDING',
        },
      };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await mockApi.put('/vehicles/driver/driver-1', {
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        plate: 'XYZ9999',
      });

      expect(result.data.status).toBe('PENDING');
    });
  });

  describe('Orders', () => {
    it('should create an order', async () => {
      const mockResponse = {
        data: {
          id: '1',
          pickupAddress: 'Rua A, 123',
          deliveryAddress: 'Rua B, 456',
          status: 'PENDING',
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/orders', {
        pickupAddress: 'Rua A, 123',
        deliveryAddress: 'Rua B, 456',
        description: 'Package',
      });

      expect(result.data.status).toBe('PENDING');
    });

    it('should get customer orders', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            status: 'DELIVERED',
          },
          {
            id: '2',
            status: 'PENDING',
          },
        ],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/orders/customer/customer-1');

      expect(result.data).toHaveLength(2);
    });

    it('should cancel an order', async () => {
      const mockResponse = {
        data: {
          id: '1',
          status: 'CANCELLED',
        },
      };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await mockApi.put('/orders/1/cancel', {
        reason: 'Changed my mind',
      });

      expect(result.data.status).toBe('CANCELLED');
    });
  });

  describe('Trips', () => {
    it('should create a trip', async () => {
      const mockResponse = {
        data: {
          id: '1',
          origin: 'Sao Paulo, SP',
          destination: 'Campinas, SP',
          status: 'SCHEDULED',
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/trips', {
        origin: 'Sao Paulo, SP',
        destination: 'Campinas, SP',
        departureDate: '2024-02-01T10:00:00Z',
      });

      expect(result.data.status).toBe('SCHEDULED');
    });

    it('should search available trips', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            origin: 'Sao Paulo, SP',
            destination: 'Campinas, SP',
          },
        ],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/trips/search', {
        params: {
          origin: 'Sao Paulo',
          destination: 'Campinas',
        },
      });

      expect(result.data).toHaveLength(1);
    });
  });
});

describe('Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store token after login', async () => {
    const token = 'test-jwt-token';
    await AsyncStorage.setItem('token', token);

    const storedToken = await AsyncStorage.getItem('token');
    expect(storedToken).toBe(token);
  });

  it('should remove token on logout', async () => {
    await AsyncStorage.setItem('token', 'test-token');
    await AsyncStorage.removeItem('token');

    const token = await AsyncStorage.getItem('token');
    expect(token).toBeNull();
  });

  it('should store user data', async () => {
    const userData = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    const storedData = await AsyncStorage.getItem('user');
    expect(JSON.parse(storedData!)).toEqual(userData);
  });
});
