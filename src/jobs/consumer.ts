import { Channel } from "amqplib";
import { sendEmail } from "../services/emailService";
import { prisma } from "../config/prisma";
import moment from "moment-timezone";

moment.tz.load(require('moment-timezone/data/packed/latest.json'));

export const consumeBirthdayJobs = async (channel: Channel, queue: string) => {
    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const job = JSON.parse(msg.content.toString());
            console.log("Successfully processed job:", job);

            try {
                const user = await prisma.user.findUnique({
                    where: { email: job.email },
                });
                if (user) {
                    const today = moment().tz(user.timezone).format("YYYY-MM-DD");
                    const birthday = moment(user.birthday).tz(user.timezone).format("YYYY-MM-DD");
                    if (today === birthday) {
                        await sendEmail(user);
                    } else {
                        console.log(`Today is not ${user.first_name}'s birthday.`);
                    }
                } else {
                    console.error(`User not found for email: ${job.email}`);
                }
            } catch (error) {
                console.error("Error processing job:", error);
            } finally {
                channel.ack(msg);
            }
        }
    });
};
