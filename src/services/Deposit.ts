import { Request, Response } from "express";
import { prisma } from "../server";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { Account, User } from "@prisma/client";
import { store } from "../utils/store";
import { operatorChecker, todateTime } from "../utils";

// Faire un dépôt
export const makeDeposit = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            customer: z.string().nonempty(),
            amount: z.number().nonnegative(),
            createdAt: z.coerce.date(),
            p_method: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, status: 400, message: "Veuillez vérifier les champs", data: {} });
        const { user } = req.body.user as { user: User };
        const data = validation.data;
        let targetted_user: User;
        let targetted_account: Account;
        if (user.role == "agent") {
            const findUser = await prisma.user.findUnique({ where: { id: validation.data.customer } });
            if (!findUser) return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
            targetted_user = findUser;
            const findAccount = await prisma.account.findFirst({ where: { userId: findUser.id } });
            if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
        } else {
            targetted_account = (await prisma.account.findFirst({ where: { userId: user.id } }))!; targetted_user = user;
        }
        const report = await prisma.report.create({ data: { type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid", agentId: targetted_user.agentId!, customerId: targetted_user.id, } });
        if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        const [deposit, aUpdate] = await prisma.$transaction([
            prisma.deposit.create({ data: { account: targetted_account.id, amount: validation.data.amount, createdAt: validation.data.createdAt, customer: targetted_user.id, madeby: "agent", payment: validation.data.p_method, reportId: report.id } }),
            prisma.account.update({ where: { id: targetted_account.id }, data: { balance: targetted_account.balance + data.amount } }),
        ]);
        if (!aUpdate && !deposit) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
        await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
        return res.status(200).send({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

export async function makeMobileMoneyDeposit(req: Request, res: Response) {
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
            return res.status(500).send();
        }
        if (store.includes(validation_result.data.cpm_trans_id)) {
            console.log(`Found duplicate id in store ${validation_result.data.cpm_trans_id} : Aborting processing`)
            return res.status(409).send({ error: true, message: "", data: {} });
        }
        store.push(validation_result.data.cpm_trans_id);
        if (validation_result.data.cpm_error_message === "SUCCES") {
            let targetted_user: User;
            let targetted_account: Account;
            const findUser = await prisma.user.findUnique({ where: { id: data.customer } });
            if (!findUser) return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
            targetted_user = findUser;
            const findAccount = await prisma.account.findFirst({ where: { userId: findUser.id } });
            if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
            const report = await prisma.report.create({
                data: { type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid", customerId: targetted_user.id, }
            });
            if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
            const [deposit, aUpdate] = await prisma.$transaction([
                prisma.deposit.create({
                    data: { account: targetted_account.id, amount: data.amount, createdAt: todateTime(new Date(data.createdAt)), customer: targetted_user.id, madeby: "agent", payment: operatorChecker(validation_result.data.cel_phone_num), reportId: report.id }
                }),
                prisma.account.update({ where: { id: targetted_account.id }, data: { balance: targetted_account.balance + data.amount } }),
            ]);
            if (!aUpdate && !deposit) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
            await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
            return res.status(200).send({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
        }
        console.log(`A payment failed`)
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}