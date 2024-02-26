import { Request, Response } from "express";
import { prisma } from "../server";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

export const report_all = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            type: z.string(),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const vdata = validation.data;

        const reportData = await prisma.report.findMany({ where: { type: vdata.type, status: 'paid', createdat: { gte: vdata.startDate, lte: vdata.endDate, } }, include: { agent: true, customer: true } });
        const aggregate = await prisma.report.groupBy({ by: ["payment"], _sum: { amount: true }, where: { status: 'paid', type: vdata.type, createdat: { gte: vdata.startDate, lte: vdata.endDate, } } });

        const aggregatedData = aggregate.reduce<{ [key: string]: number; total: number }>((result, item) => {
            const paymentMethod = item.payment;
            const amount = item._sum.amount ?? 0.0;
            result[paymentMethod] = (result[paymentMethod] || 0) + amount;
            result.total = (result.total || 0) + amount;
            return result;
        }, { total: 0 });
        const data = { reports: reportData, ...aggregatedData };

        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

// export const totalReport = async (req: Request, res: Response) => {
//     try {
//         const schema = z.object({
//             value: z.string().default("total"),
//             agent: z.array(z.string()),
//             method: z.string().default(""),
//             type: z.string().default("contribution"),
//         });
//         const validation = schema.safeParse(req.body);
//         if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
//         const data = validation.data;
//         switch (data.value) {
//             case "total":
//                 utilsTotalReport(data.type, data.agent, data.method); break;
//             case "":
//                 utilsNonSpecifiedReport(data.type, data.agent, data.method); break;
//             default: break;
//         }
//     } catch (err) {
//         console.log(err);
//         return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
//     }
// }

// Commissions.
export const totalBetReport = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            startDate: z.coerce.date(), endDate: z.coerce.date(),
            type: z.string().default("all"),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const vdata = validation.data;
        const where = vdata.type == "all" ? { type: { in: ["book", "bet"] }, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }
            : { type: vdata.type, createdat: { gte: vdata.startDate, lte: vdata.endDate, } };
        const reportData = await prisma.betReport.findMany({ where, include: { agent: true, customer: true } });
        const goodnessAggregate = await prisma.betReport.groupBy({ by: ["type"], _sum: { goodnessbalance: true }, where });
        const commercialAggregate = await prisma.betReport.groupBy({ by: ["type"], _sum: { agentbalance: true }, where });
        const commAggregatedData = commercialAggregate.reduce<{ [key: string]: number; totalagent: number }>((result, item) => {
            const type = item.type + "agent";
            const amount = item._sum.agentbalance ?? 0.0;
            result[type] = (result[type] || 0) + amount;
            result.totalagent = (result.totalagent || 0) + amount;
            return result;
        }, { totalagent: 0 });

        const goodAggregatedData = goodnessAggregate.reduce<{ [key: string]: number; totalgood: number }>((result, item) => {
            const type = item.type + "good";
            const amount = item._sum.goodnessbalance ?? 0.0;
            result[type] = (result[type] || 0) + amount;
            result.totalgood = (result.totalgood || 0) + amount;
            return result;
        }, { totalgood: 0 });

        const data = { reports: reportData, ...commAggregatedData, ...goodAggregatedData };

        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

// Solde d'un agent
export const agentBalance = async (req: Request, res: Response) => {
    try {
        const schema = z.object({ startDate: z.coerce.date(), endDate: z.coerce.date(), agentId: z.string() });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const data = validation.data;
        const balance = await prisma.betReport.aggregate({ where: { agentId: data.agentId, createdat: { gte: data.startDate, lte: data.endDate, } }, _sum: { agentbalance: true }, });
        return res.status(200).send({ error: false, data: balance._sum.agentbalance ?? 0, message: "ok" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

// Solde clients
export const allCustomersBalance = async (req: Request, res: Response) => {
    try {
        const data = await prisma.account.findMany({ include: { user: true } });
        return res.status(200).send({ data: data });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

// Solde agents
export const allAgentsBalance = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            startDate: z.coerce.date(), endDate: z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        }
        const data = await prisma.betReport.groupBy({ by: ["agentId"], _sum: { agentbalance: true }, where: { createdat: { gte: validation.data.startDate, lte: validation.data.endDate, } } });
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}