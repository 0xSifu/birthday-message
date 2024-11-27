import express from "express";
import { createUser, deleteUser } from "../controllers/userController";

const router = express.Router();

// router.post("/user", createUser);
// router.delete("/user/:id", deleteUser);

export default router;
