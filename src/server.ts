import express from "express";
import { setupRabbitMQ } from "./config/rabbitmq";
import { publishBirthdayJob } from "./jobs/publisher";
import { consumeBirthdayJobs } from "./jobs/consumer";
import { recoverFailedJobs } from "./jobs/recovery";
import { createUser, deleteUser } from "./controllers/userController";
import moment, { parseTwoDigitYear } from "moment-timezone";
import cron from "node-cron";
import { sendEmail } from "./services/emailService";
import { prisma } from "./config/prisma";

moment.tz.load(require('moment-timezone/data/packed/latest.json'));

const app = express();
app.use(express.json());

const generateUniqueId = () => {
    return Math.floor(Math.random() * 1000000);
};

(async () => {
    const { connection, channel, queue, deadLetterQueue } = await setupRabbitMQ();

    consumeBirthdayJobs(channel, queue);

    cron.schedule("* * * * *", async () => {
        const users = await prisma.user.findMany();
        const today = moment();
        const todayDay = today.date();

        for (const user of users) {
            const birthday = moment(user.birthday).tz(user.timezone);
            const birthdayDay = birthday.date();
    
            if (todayDay === birthdayDay) {
                console.log("Sending Birthday Email to : ", user.first_name);
                const sendTime = moment.tz(user.timezone).set({ hour: 16, minute: 20, second: 0 });
                const now = moment();
    
                if (sendTime.isAfter(now)) {
                    setTimeout(async () => {
                        await sendEmail(user);
                    }, sendTime.diff(now));
                }
            } else {
                console.log(`Today is not ${user.first_name}'s birthday.`);
            }
        }
    });

    app.post("/user", async (req, res) => {
        const { first_name, last_name, email, birthday, location, timezone } = req.body;
        console.log("Testing first_name, last_name, email, birthday, location, timezone : ", first_name, last_name, email, birthday, location, timezone);
        const job = {
            id: generateUniqueId(),
            first_name,
            last_name,
            email,
            birthday,
            location,
            timezone
        };
        const user = await createUser(req);
        if (user) {
            await publishBirthdayJob(channel, queue, job);
            res.status(201).send("Job scheduled.");
        } else {
            res.status(500).json({ error: "Failed to create user." });
        }
    });

    app.post("/recover", async (req, res) => {
        await recoverFailedJobs(channel, deadLetterQueue, queue);
        res.status(200).send("Recovery complete.");
    });

    process.on("SIGINT", async () => {
        await connection.close();
        process.exit(0);
    });
})();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
