import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TripsController (e2e)', () => {
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

  describe('GET /trips', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/trips')
        .expect(401);
    });
  });

  describe('POST /trips', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/trips')
        .send({
          origin: 'Sao Paulo, SP',
          destination: 'Campinas, SP',
          departureDate: '2024-02-01T10:00:00Z',
          availableCapacity: 100,
          pricePerKg: 2.50,
        })
        .expect(401);
    });
  });

  describe('GET /trips/:id', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/trips/some-id')
        .expect(401);
    });
  });

  describe('GET /trips/available', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/trips/available')
        .expect(401);
    });
  });

  describe('GET /trips/search', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({
          origin: 'Sao Paulo',
          destination: 'Campinas',
        })
        .expect(401);
    });
  });

  describe('PUT /trips/:id/status', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/trips/some-id/status')
        .send({ status: 'IN_PROGRESS' })
        .expect(401);
    });
  });

  describe('PUT /trips/:id/cancel', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .put('/trips/some-id/cancel')
        .send({ reason: 'Vehicle breakdown' })
        .expect(401);
    });
  });

  describe('GET /trips/driver/:driverId', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/trips/driver/some-driver-id')
        .expect(401);
    });
  });
});
