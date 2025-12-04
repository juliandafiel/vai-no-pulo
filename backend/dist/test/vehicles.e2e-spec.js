"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('VehiclesController (e2e)', () => {
    let app;
    let authToken;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe());
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
            return request(app.getHttpServer())
                .put('/vehicles/some-id/status')
                .send({})
                .expect(401);
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
//# sourceMappingURL=vehicles.e2e-spec.js.map