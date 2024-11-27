import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export const sendEmail = async (user: any) => {
    try {
        const response = await axios.post("https://email-service.digitalenvision.com.au/send-email", {
            email: user.email, // Use the correct field name
            message: `Hey, ${user.firstName} ${user.lastName}, it’s your birthday!`, // Adjust the message as needed
        });
        console.log(`Email sent to ${user.email}:`, response.status);
    } catch (error: any) {
        console.error(`Failed to send email to ${user.email}:`, error.response ? error.response.data : error.message);

        // Check if the user exists before creating a FailedEmail record
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id }, // Ensure you have the correct user ID
        });

        if (existingUser) {
            // Save the failed email to the database
            await prisma.failedEmail.create({
                data: {
                    user_id: user.id,
                    email: user.email,
                    message: `Failed to send email: ${error.message}`,
                },
            });
        } else {
            console.error(`User with ID ${user.id} does not exist. Cannot log failed email.`);
        }

        throw error;
    }
};