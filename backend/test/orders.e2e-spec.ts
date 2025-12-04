import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OrdersController (e2e)', () => {
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

  describe('GET /orders', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .expect(401);
    });
  });

  describe('POST /orders', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          pickupAddress: 'Rua A, 123',
          deliveryAddress: 'Rua B, 456',
          description: 'Test package',
        })
        .expect(401);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/orders/some-id')
        .expect(401);
    });
  });

  describe('PUT /orders/:id/status', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/orders/some-id/status')
        .send({ status: 'ACCEPTED' })
        .expect(401);
    });
  });

  describe('PUT /orders/:id/cancel', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/orders/some-id/cancel')
        .send({ reason: 'Changed my mind' })
        .expect(401);
    });
  });

  describe('GET /orders/customer/:customerId', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/orders/customer/some-customer-id')
        .expect(401);
    });
  });

  describe('GET /orders/driver/:driverId', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/orders/driver/some-driver-id')
        .expect(401);
    });
  });
});
