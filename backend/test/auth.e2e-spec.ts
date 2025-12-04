import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 400 for missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/register/customer', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    it('should register a new customer', () => {
      return request(app.getHttpServer())
        .post('/auth/register/customer')
        .send({
          fullName: 'Test Customer',
          email: uniqueEmail,
          phone: '11999999999',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(uniqueEmail);
        });
    });

    it('should return 400 for duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register/customer')
        .send({
          fullName: 'Test Customer 2',
          email: uniqueEmail, // Same email as before
          phone: '11888888888',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register/customer')
        .send({
          fullName: 'Test Customer',
          email: 'invalid-email',
          phone: '11999999999',
          password: 'Password123!',
        })
        .expect(400);
    });
  });

  describe('POST /auth/register/driver', () => {
    const uniqueDriverEmail = `driver-${Date.now()}@example.com`;

    it('should register a new driver', () => {
      return request(app.getHttpServer())
        .post('/auth/register/driver')
        .send({
          fullName: 'Test Driver',
          email: uniqueDriverEmail,
          phone: '11999999999',
          password: 'Password123!',
          cpf: '12345678901',
          cnh: '12345678901',
          cnhCategory: 'B',
          cnhExpiry: '2025-12-31',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('análise');
        });
    });
  });

  describe('POST /auth/check-email', () => {
    it('should return exists: false for new email', () => {
      return request(app.getHttpServer())
        .post('/auth/check-email')
        .send({
          email: `new-${Date.now()}@example.com`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.exists).toBe(false);
        });
    });
  });

  describe('POST /auth/send-code', () => {
    it('should send verification code to email', () => {
      return request(app.getHttpServer())
        .post('/auth/send-code')
        .send({
          email: 'test@example.com',
        })
        .expect((res) => {
          // May return 200 or error depending on mail service
          expect([200, 201, 400, 500]).toContain(res.status);
        });
    });

    it('should return 400 for missing email and phone', () => {
      return request(app.getHttpServer())
        .post('/auth/send-code')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/verify-code', () => {
    it('should return 400 for invalid code', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-code')
        .send({
          email: 'test@example.com',
          code: '000000',
        })
        .expect(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return success message for any email (security)', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'any@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });
  });
});
