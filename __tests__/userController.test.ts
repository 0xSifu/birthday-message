import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/prisma';

describe('User Controller', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should create a new user', async () => {
        const response = await request(app)
            .post('/user')
            .send({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                birthday: '1990-11-27',
                location: 'New York',
                timezone: 'America/New_York',
            });

        expect(response.status).toBe(201);
        expect(response.text).toBe('Job scheduled.');
    });

    it('should return 500 for duplicate user', async () => {
        await request(app)
            .post('/user')
            .send({
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                birthday: '1990-11-27',
                location: 'New York',
                timezone: 'America/New_York',
            });

        const response = await request(app)
            .post('/user')
            .send({
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                birthday: '1990-11-27',
                location: 'New York',
                timezone: 'America/New_York',
            });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to create user.');
    });
});