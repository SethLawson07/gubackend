import { Request, Response } from "express";
import { prisma } from "../server";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { User } from "@prisma/client";

// Historique de gains d'un agent
export const agentBalanceHistory = async (req: Request, res: Response) => {
    try {
        const agentId = req.params.agentid;
        if (!agentId) return res.status(400).send({ error: true, message: "Agent id is required", data: {} });
        const data = await prisma.betReport.aggregateRaw({
            pipeline: [
                { $match: { 'agentId': { "$oid": `${agentId}` } } }, { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $group: { _id: { month: { $month: '$createdat' }, year: { $year: '$createdat' }, }, data: { $push: '$$ROOT' }, count: { $sum: 1 }, }, },
            ],
        });
        return res.status(200).send({ data: data });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const userActivity = async (req: Request, res: Response) => {
    try {
        const schema = z.object({ startDate: z.coerce.date(), endDate: z.coerce.date(), userId: z.string(), });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const vdata = validation.data;
        const user = await prisma.user.findUnique({ where: { id: vdata.userId } });
        if (!user) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const data = (await prisma.report.findMany({
            where: user.role == "customer" ? { status: { in: ["unpaid", "paid"] }, customerId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }
                : { status: { in: ["unpaid", "paid"] }, agentId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }, include: { agent: true, customer: true }
        })).reverse();
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const userLastActivities = async (req: Request, res: Response) => {
    try {
        const { user } = req.body.user as { user: User };
        const data = (await prisma.report.findMany({
            where: user.role == "customer" ? { customerId: user.id, status: { in: ["paid", "unpaid"] } } : { agentId: user.id, status: { in: ["paid", "unpaid"] } }, include: { agent: true, customer: true },
            take: 3,
        })).reverse();
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}