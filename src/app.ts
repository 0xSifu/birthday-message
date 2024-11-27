import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/userRoutes";
import { prisma } from "./config/prisma";

const app = express();
app.use(bodyParser.json());
app.use(userRoutes);

prisma.$connect().then(() => {
    console.log("Database connected.");
});

export default app;
