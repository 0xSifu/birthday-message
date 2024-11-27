import { sendEmail } from '../src/services/emailService';
import { prisma } from '../src/config/prisma';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);

describe('Email Service', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should send an email and log it', async () => {
        const user = {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            birthday: new Date('1990-11-27'),
            timezone: 'America/New_York',
        };

        mock.onPost('https://email-service.digitalenvision.com.au/send-email').reply(200);

        await sendEmail(user);

        const emailLog = await prisma.sentEmail.findFirst({
            where: { userId: user.id },
        });

        expect(emailLog).toBeDefined();
        expect(emailLog?.email).toBe(user.email);
    });

    it('should handle email sending failure', async () => {
        const user = {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            birthday: new Date('1990-11-27'),
            timezone: 'America/New_York',
        };

        mock.onPost('https://email-service.digitalenvision.com.au/send-email').reply(500);

        await expect(sendEmail(user)).rejects.toThrow('Failed to send email to john.doe@example.com');
    });

    it('should handle random errors and timeouts', async () => {
        const user = {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            birthday: new Date('1990-11-27'),
            timezone: 'America/New_York',
        };

        mock.onPost('https://email-service.digitalenvision.com.au/send-email').timeout();

        await expect(sendEmail(user)).rejects.toThrow('Failed to send email to john.doe@example.com');
    });
});