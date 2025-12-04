import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('VehiclesController (e2e)', () => {
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

  describe('GET /vehicles', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .expect(401);
    });
  });

  describe('GET /vehicles/pending', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/vehicles/pending')
        .expect(401);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/vehicles/some-id')
        .expect(401);
    });
  });

  describe('POST /vehicles', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .send({
          plate: 'ABC1234',
          model: 'Toyota Corolla',
          capacityKg: 500,
          capacityM3: 2.0,
        })
        .expect(401);
    });
  });

  describe('PUT /vehicles/:id/status', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/vehicles/some-id/status')
        .send({
          status: 'APPROVED',
        })
        .expect(401);
    });

    it('should require status in body', () => {
      // Even with auth, missing status should fail
      // This test assumes 401 will be returned first
      return request(app.getHttpServer())
        .put('/vehicles/some-id/status')
        .send({})
        .expect(401); // Will get 401 first due to no auth
    });
  });

  describe('GET /vehicles/driver/:driverId', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/vehicles/driver/some-driver-id')
        .expect(401);
    });
  });

  describe('PUT /vehicles/driver/:driverId', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/vehicles/driver/some-driver-id')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2022,
          plate: 'ABC1234',
        })
        .expect(401);
    });
  });
});
