import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { store } from "../utils/store";
import { opened_book, operatorChecker, sheet_contribute, sheet_contribute_mobile, todateTime } from "../utils";
import { Contribution } from "@prisma/client";
import dayjs from "dayjs";
import { mMoneyContributionJobQueue } from "../queues/queues";


export async function momo_payment_event(req: Request, res: Response) {
    try {
        const schema = z.object({
            user_id: z.string(),
            order_id: z.string(),
            amount_paid: z.number().int().positive()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send()
        const { data } = validation_result
        const targetted_user = await prisma.user.findFirst({
            where: {
                finance_pro_id: data.user_id
            }
        })
        if (!targetted_user) return res.status(404).send({ message: "Utilisateur non trouvé" })
        const targetted_order = await prisma.order.findUnique({
            where: {
                id: data.order_id
            }
        })
        if (!targetted_order) return res.status(404).send({ message: "Commande non trouvée" })
        const new_remainder = targetted_order.remainder - data.amount_paid
        await prisma.order.update({
            where: {
                id: targetted_order.id
            },
            data: {
                amount: new_remainder
            }
        })
        return res.status(200).send({ remainder: new_remainder })
    } catch (err) {
        console.error(`Error while processing momo payment event ${err}`)
        return res.status(500).send()
    }
}

export async function payment_event(req: Request, res: Response) {
    try {
        const order_id = req.params.id
        const schema = z.object({
            cpm_amount: z.string(),
            cpm_trans_id: z.string(),
            payment_method: z.string(),
            cel_phone_num: z.string(),
            cpm_error_message: z.string(),
            cpm_trans_date: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) {
            console.log(`Error while parsing response from cinet pay ${req.body}`)
            return res.status(500).send()
        }
        const { data } = validation_result
        if (store.includes(data.cpm_trans_id)) {
            console.log(`Found duplicate id in store ${data.cpm_trans_id} : Aborting processing`)
            return res.status(409).send()
        }
        store.push(data.cpm_trans_id)
        if (data.cpm_error_message === "SUCCES") {
            const targetted_order = await prisma.order.findUnique({
                where: {
                    id: order_id
                }
            })
            if (!targetted_order) {
                console.log(`Order not found ${order_id}`)
                return res.status(404).send()
            }
            await prisma.transaction.create({
                data: {
                    user: targetted_order.userId,
                    amount: targetted_order.remainder,
                    date: data.cpm_trans_date,
                }
            })
            await prisma.order.update({
                where: {
                    id: targetted_order.id
                },
                data: {
                    paid: true,
                    status: "PAID",
                    remainder: 0
                }
            })
            console.log("Payment processed")
            return res.status(200).send()
        }
        console.log(`A payment failed`)
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}


export async function contribution_event(req: Request, res: Response) {
    try {
        let buffer = Buffer.from(req.params.data, 'base64');
        let text = buffer.toString('ascii');
        let data = JSON.parse(text);
        const schema = z.object({
            cpm_amount: z.string(),
            cpm_trans_id: z.string(),
            payment_method: z.string(),
            cel_phone_num: z.string(),
            cpm_error_message: z.string(),
            cpm_trans_date: z.string()
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) {
            console.log(`Error while parsing response from cinet pay ${req.body}`)
            return res.status(400).send()
        }
        if (store.includes(validation_result.data.cpm_trans_id)) {
            console.log(`Found duplicate id in store ${validation_result.data.cpm_trans_id} : Aborting processing`)
            return res.status(409).send({ error: true, message: "", data: {} });
        }
        store.push(validation_result.data.cpm_trans_id);
        if (validation_result.data.cpm_error_message === "SUCCES") {
            const targetedUser = await prisma.user.findUnique({ where: { id: data.customer } });
            if (!targetedUser) return res.status(404).send({ error: true, message: "User not found", data: {} });
            const userAgent = await prisma.user.findUnique({ where: { id: targetedUser.agentId! } });
            const book = await opened_book(targetedUser!);
            let result = await sheet_contribute(data.customer, data.amount, data.p_method);
            const userAccount = await prisma.account.findFirst({ where: { user: data.customer } });
            let contribution: Contribution; // CreatedContribution
            if (!result.error) {
                const report = await prisma.report.create({
                    data: {
                        type: "contribution", amount: data.amount, createdat: todateTime(data.createdAt), payment: operatorChecker(validation_result.data.cel_phone_num),
                        sheet: result.sheet!, cases: result.cases, status: "paid", agentId: userAgent!.id, customerId: targetedUser.id,
                    }
                });
                if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
                contribution = await prisma.contribution.create({
                    data: {
                        account: userAccount?.id!, createdAt: todateTime(data.createdAt), userId: targetedUser?.id!, pmethod: data.p_method, awaiting: "none",
                        status: "paid", amount: data.amount, cases: result.cases!, agent: data.agent, sheet: result.sheet!.id, reportId: report.id,
                    },
                });
                if (contribution) {
                    await mMoneyContributionJobQueue.add("mMoneyContribution", { data, result, book });
                    return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution! });
                } else {
                    return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} });
                }
            } else {
                console.log(result.message);
                console.log("Error");
                return res.status(200).send({ error: result.error, message: result.message, data: {} });
            }
        }
        console.log(`A payment failed`)
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}