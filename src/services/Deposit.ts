import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { Account, User } from "@prisma/client";

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