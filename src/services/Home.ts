import { User } from "@prisma/client";
import { Request, Response } from "express";
import { opened_sheet } from "../utils";
import { prisma } from "../server";


export const customerHome = async (req: Request, res: Response) => {
    try {
        const { user } = req.body.user as { user: User };
        const sheet = await opened_sheet(user);
        const account = await prisma.account.findFirst({ where: { userId: user.id, type: "tontine" } });
        const banner = (await prisma.banner.findMany()).reverse();
        return res.status(200).send({ error: false, data: { ...sheet.data, book: sheet.book, account, banner, }, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const agentHome = async (req: Request, res: Response) => {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const adminHome = async (req: Request, res: Response) => {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}
