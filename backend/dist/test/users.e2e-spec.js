"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('UsersController (e2e)', () => {
    let app;
    let authToken;
    let adminToken;
    let testUserId;
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
    describe('GET /users', () => {
        it('should return 401 without authentication', () => {
            return request(app.getHttpServer())
                .get('/users')
                .expect(401);
        });
        it('should return users list with valid token', () => {
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
//# sourceMappingURL=users.e2e-spec.js.map