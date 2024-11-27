import { consumeBirthdayJobs } from '../src/jobs/consumer';
import { Channel } from 'amqplib';
import { prisma } from '../src/config/prisma';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

const mock = new MockAdapter(axios);

describe('Consumer', () => {
    let channel: Channel;

    beforeEach(() => {
        // Create a mock channel
        channel = {
            consume: jest.fn(),
            ack: jest.fn(),
            sendToQueue: jest.fn(),
            get: jest.fn(),
        } as unknown as Channel; // Type assertion to Channel
    });

    afterEach(async () => {
        await prisma.sentEmail.deleteMany(); // Clean up after tests
        await prisma.user.deleteMany(); // Clean up after tests
    });

    it('should process birthday jobs and send emails', async () => {
        const user = await prisma.user.create({
            data: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                birthday: new Date('1990-11-27'),
                timezone: 'America/New_York',
                location: 'New York',
            },
        });

        // Mock the user retrieval and email sending
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user as any);
        mock.onPost('https://email-service.digitalenvision.com.au/send-email').reply(200);

        // Simulate a job message
        const job = {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            birthday: user.birthday,
            timezone: user.timezone,
            location: user.location,
        };

        // Mock the channel.get to return the job message
        (channel.get as jest.Mock).mockResolvedValueOnce({
            content: Buffer.from(JSON.stringify(job)),
        });
        
        // Call the consume function with a mocked message
        await consumeBirthdayJobs(channel, 'birthday_jobs');

        // Check if the email was sent
        const emailLog = await prisma.sentEmail.findFirst({
            where: { userId: user.id },
        });

        expect(emailLog).toBeDefined();
        expect(emailLog?.email).toBe(user.email);
    });

    it('should handle race conditions', async () => {
        const user = await prisma.user.create({
            data: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                birthday: new Date('1990-11-27'),
                timezone: 'America/New_York',
                location: 'New York',
            },
        });

        // Mock the user retrieval and email sending
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
        mock.onPost('https://email-service.digitalenvision.com.au/send-email').reply(200);

        // Simulate two concurrent jobs for the same user
        const job1 = { email: user.email, first_name: user.first_name, last_name: user.last_name, birthday: user.birthday, timezone: user.timezone, location: user.location };
        const job2 = { email: user.email, first_name: user.first_name, last_name: user.last_name, birthday: user.birthday, timezone: user.timezone, location: user.location };

        // Mock the channel.get to return the job messages
        (channel.get as jest.Mock).mockResolvedValueOnce({
            content: Buffer.from(JSON.stringify(job1)),
        }).mockResolvedValueOnce({
            content: Buffer.from(JSON.stringify(job2)),
        });

        // Call the consume function with mocked messages
        await Promise.all([
            consumeBirthdayJobs(channel, 'birthday_jobs'),
            consumeBirthdayJobs(channel, 'birthday_jobs'),
        ]);

        // Check if the email was sent only once
        const emailLogs = await prisma.sentEmail.findMany({
            where: { userId: user.id },
        });

        expect(emailLogs.length).toBe(1); // Ensure only one email was logged
    });
});