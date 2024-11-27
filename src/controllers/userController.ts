import { Request, Response } from "express";
import { User } from "@prisma/client";
import { prisma } from "../config/prisma";


export const createUser = async (req: Request): Promise<any> => {
    const { first_name, last_name, birthday, location, email, timezone } = req.body;

    try {
        const user = await prisma.user.create({
            data: {
                first_name,
                last_name,
                birthday: new Date(birthday),
                location,
                email,
                timezone,
            },
        });

        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user."); 
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return res.status(204).send();
};
