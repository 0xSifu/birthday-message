import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export const generateUniqueId = () => {
    return Math.floor(Math.random() * 1000000);
};

export const sendEmail = async (user: any) => {
    const emailSent = await prisma.sentEmail.findFirst({
        where: {
            email: user.email,
        },
    });

    console.log("emailSent : ", emailSent);

    if (emailSent) {
        console.log(`Email already sent to ${user.email} for their birthday.`);
        return;
    }

    try {
        const response = await axios.post("https://email-service.digitalenvision.com.au/send-email", {
            email: user.email,
            message: `Hey, ${user.first_name} ${user.last_name}, it’s your birthday!`,
        });
        console.log(`Email sent to ${user.email}:`, response.status);

        await prisma.sentEmail.create({
            data: {
                userId: user.id,
                email: user.email,
                sentAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error(`Failed to send email to ${user.email}:`, error.response ? error.response.data : error.message);

        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (existingUser) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedEmails: `Failed to send email: ${error.message}`,
                },
            });
            
            await prisma.failedEmail.create({
                data: {
                    user_id: user.id,
                    email: user.email,
                    message: `Failed to send email: ${error.message}`,
                },
            });

            console.log(`Updated user ID ${user.id} with failed email message and logged in FailedEmail.`);
        } else {
            console.error(`User with ID ${user.id} does not exist. Cannot log failed email.`);
        }

        throw error;
    }

    return true;
};
