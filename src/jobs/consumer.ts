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
                        const emailSent = await prisma.sentEmail.findFirst({
                            where: {
                                userId: user.id,
                                email: user.email,
                                sentAt: {
                                    gte: new Date(new Date(user.birthday).setHours(0, 0, 0, 0)),
                                    lt: new Date(new Date(user.birthday).setHours(23, 59, 59, 999)),
                                },
                            },
                        });

                        if (emailSent) {
                            console.log(`Email already sent to ${user.email} for their birthday.`);
                        } else {
                            const response = await sendEmail(user);
                            if (response) {
                                await prisma.sentEmail.create({
                                    data: {
                                        userId: user.id,
                                        email: user.email,
                                    },
                                });
                                console.log(`Email sent to ${user.email}:`);
                            }
                        }
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
