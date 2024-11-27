import { Channel } from "amqplib";

interface BirthdayJob {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    birthday: string;
    timezone: string;
}

export const publishBirthdayJob = async (
    channel: Channel,
    queue: string,
    job: BirthdayJob
) => {
    if (!job.first_name || !job.last_name || !job.email || !job.birthday || !job.timezone) {
        console.error("Job data is incomplete:", job);
        throw new Error("Incomplete job data.");
    }

    const message = JSON.stringify(job);
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(`Published job to queue: ${job.first_name} ${job.last_name}`);
};

