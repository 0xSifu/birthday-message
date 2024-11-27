import { recoverFailedJobs } from '../src/jobs/recovery';
import { Channel } from 'amqplib';

describe('Job Recovery', () => {
    let channel: Channel;

    beforeEach(() => {
        channel = {
            get: jest.fn(),
            sendToQueue: jest.fn(),
            ack: jest.fn(),
        } as unknown as Channel;
    });

    it('should recover failed jobs from the dead letter queue', async () => {
        const deadLetterQueue = 'dead_letter_queue';
        const mainQueue = 'birthday_jobs';
    
        const failedJob = {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            birthday: '1990-11-27',
            timezone: 'America/New_York',
        };

        (channel.get as jest.Mock).mockResolvedValueOnce({
            content: Buffer.from(JSON.stringify(failedJob)),
        });

        await recoverFailedJobs(channel, deadLetterQueue, mainQueue);

        expect(channel.sendToQueue).toHaveBeenCalledWith(mainQueue, expect.any(Buffer), { persistent: true });
        expect(channel.sendToQueue).toHaveBeenCalledWith(mainQueue, Buffer.from(JSON.stringify(failedJob)), { persistent: true });
    });
});