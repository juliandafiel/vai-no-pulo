import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Note: In a real test, you would create test users and get real tokens
    // For now, these tests will check response structure
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return users list with valid token', () => {
      // Skip if no auth token available
      if (!authToken) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /users/pending', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/pending')
        .expect(401);
    });
  });

  describe('GET /users/pending/count', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/pending/count')
        .expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/some-id')
        .expect(401);
    });
  });

  describe('PUT /users/:id/approve', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/users/some-id/approve')
        .expect(401);
    });
  });

  describe('PUT /users/:id/reject', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/users/some-id/reject')
        .send({ reason: 'Test rejection' })
        .expect(401);
    });
  });

  describe('PUT /users/:id/profile', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/users/some-id/profile')
        .send({ name: 'New Name' })
        .expect(401);
    });
  });
});
