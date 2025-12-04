"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('OrdersController (e2e)', () => {
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
//# sourceMappingURL=orders.e2e-spec.js.map