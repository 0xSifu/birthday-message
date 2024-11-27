import amqplib, { Channel, Connection } from "amqplib";
import dotenv from "dotenv";    

dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@localhost:5672`;

export const setupRabbitMQ = async () => {
    const connection: Connection = await amqplib.connect(RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();

    const exchange = "birthday_exchange";
    const queue = "birthday_queue";
    const deadLetterQueue = "birthday_dead_letter_queue";

    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertQueue(queue, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": exchange,
            "x-dead-letter-routing-key": "dead-letter",
        },
    });
    await channel.bindQueue(queue, exchange, "birthday");

    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.bindQueue(deadLetterQueue, exchange, "dead-letter");

    console.log("RabbitMQ setup complete");
    return { connection, channel, queue, deadLetterQueue };
};
