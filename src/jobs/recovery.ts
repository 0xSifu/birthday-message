import { Channel } from "amqplib";

export const recoverFailedJobs = async (
    channel: Channel,
    deadLetterQueue: string,
    mainQueue: string
) => {
    const failedJobs = [];
    while (true) {
        const message = await channel.get(deadLetterQueue, { noAck: true });
        if (!message) break;
        failedJobs.push(JSON.parse(message.content.toString()));
    }

    for (const job of failedJobs) {
        console.log(`Recovering job for: ${job.first_name} ${job.last_name}`);
        channel.sendToQueue(mainQueue, Buffer.from(JSON.stringify(job)), { persistent: true });
    }
    console.log("Recovery complete.");
};
