import { Request, Response } from "express";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import { agenda, prisma } from "../server";
import { store } from "../utils/store";
import { create_sheets, opened_book, operatorChecker, semoaCashPayGateway, sheet_contribute, todateTime } from "../utils";
import { Contribution, User } from "@prisma/client";
import { mMoneyContributionJobQueue } from "../queues/queues";
import { semoaCashPayHeader } from "../utils/headers";
import { fromZodError } from "zod-validation-error";
import axios from "axios";
import dayjs from "dayjs";


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
            const book = await opened_book(targetedUser);
            if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            let result = await sheet_contribute(data.customer, data.amount, data.p_method);
            const userAccount = await prisma.account.findFirst({ where: { userId: data.customer } });
            if (!userAccount) return res.status(404).send({ error: true, message: "User account not found", data: {} });
            let contribution: Contribution; // CreatedContribution
            if (!result.error && result.cases) {
                const report = await prisma.report.create({
                    data: { type: "contribution", amount: data.amount, createdat: todateTime(data.createdAt), payment: operatorChecker(validation_result.data.cel_phone_num), sheet: result.sheet!, cases: result.cases, status: "unpaid", customerId: targetedUser.id, }
                });
                if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
                contribution = await prisma.contribution.create({
                    data: { account: userAccount?.id!, createdAt: todateTime(data.createdAt), userId: targetedUser?.id!, pmethod: data.p_method, awaiting: "none", status: "paid", amount: data.amount, cases: result.cases.map(chiffre => chiffre + 1), sheet: result.sheet!.id, reportId: report.id, },
                });
                if (contribution) {
                    await mMoneyContributionJobQueue.add("mMoneyContribution", { customer: data.customer, amount: data.amount, result, book, report });
                    return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution! });
                } else { return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} }); }
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


export async function addbook_event(req: Request, res: Response) {
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
            const user = await prisma.user.findUnique({ where: { id: data.customer } });
            if (!user) return res.status(404).send({ error: true, message: "User not found", data: {} });
            const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
            if (bookIsOpened) return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
            const [created_book, report_bet] = await prisma.$transaction([
                prisma.book.create({ data: { bookNumber: "", createdAt: todateTime(data.createdAt), userId: user.id, status: "opened", sheets: [] } }),
                prisma.betReport.create({ data: { goodnessbalance: 300, agentbalance: 0, createdat: todateTime(data.createdAt), agentId: user.agentId, customerId: user.id, type: "book" } }),
            ]);
            if (!created_book || !report_bet) return res.status(400).send({ error: true, message: "Cound not create", data: {} });
            const sheets = create_sheets(created_book, 300, data.createdAt);
            if (sheets) await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
            await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
            await agenda.start();
        }
        console.log(`A payment failed`);
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}



// Create Payment (Order)
export const hookCreateOrder = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            userId: z.string(),
            type: z.string(), // deposit, contribution
            amount: z.number(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const { user } = req.body.user as { user: User };
        const header = semoaCashPayHeader();
        const data = btoa(JSON.stringify(validation.data));
        if (!(validation.data.userId == user.id)) return res.status(403).send({ error: true, message: "Forbidden", data: {} });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.SEMOA_CASHPAY_API_URL}/orders`,
            headers: header,
            data: JSON.stringify({
                "amount": validation.data.amount,
                "description": "Recharge de compte MidjoPay",
                "client": {
                    "lastname": user.user_name,
                    "firstname": user.user_name,
                    "phone": `+${user.phone}`
                },
                "gateway_id": semoaCashPayGateway(user.phone),
                "callback_url": `https://goodapp-9c0o.onrender.com/hook/validate/${data}`,
                "redirect_url": "https://google.com",
            })
        };
        const response = await axios(config);
        if (!response) return res.status(400).send({ error: true, message: "...", data: {} });
        if (!(response.data.status == "success")) return res.status(400).send({ error: true, message: "Veuillez réssayer SVP !" });
        return res.status(200).send({
            error: false, message: "ok", data: {
                action: response.data["payments_method"][0].action ?? null, phone: user.phone
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
}

const validateContribution = async (userId: string, amount: number, phone: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: true, message: "User not found", data: {} };
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    let result = await sheet_contribute(userId, amount, "customer");
    const userAccount = await prisma.account.findFirst({ where: { userId } });
    if (!userAccount) return { error: true, message: "User account not found", data: {} };
    let contribution: Contribution; // CreatedContribution
    if (!result.error && result.cases) {
        const report = await prisma.report.create({
            data: {
                type: "contribution", amount: amount, createdat: dayjs(Date.now()).format(), payment: operatorChecker(phone),
                sheet: result.sheet!, cases: result.cases, status: "unpaid", customerId: user.id,
            }
        });
        if (!report) return { error: true, message: "Oupps il s'est passé quelque chose!", data: {} };
        contribution = await prisma.contribution.create({
            data: {
                account: userAccount?.id!, createdAt: dayjs(Date.now()).format(), userId: user.id!, pmethod: operatorChecker(phone), awaiting: "none",
                status: "paid", amount: amount, cases: result.cases.map(chiffre => chiffre + 1), sheet: result.sheet!.id, reportId: report.id,
            },
        });
        if (contribution) {
            await mMoneyContributionJobQueue.add("mMoneyContribution", { customer: userId, amount: amount, result, book, report });
            return { error: false, message: "Cotisation éffectée", data: contribution! };
        } else { return { error: true, message: "Une erreur s'est produite réessayer", data: {} }; }
    } else {
        console.log(result.message);
        console.log("Error");
        return { error: result.error, message: result.message, data: {} };
    }
}

const validateDeposit = async (userId: string, amount: number, phone: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { status: 404, error: true, message: "Utilisateur non trouvé", data: {} };
    const account = await prisma.account.findFirst({ where: { userId } });
    if (!account) return { error: true, status: 404, message: "Compte non trouvé", data: {} };
    const report = await prisma.report.create({
        data: {
            type: "deposit", amount: amount, createdat: dayjs(Date.now()).format(),
            payment: operatorChecker(phone), status: "unpaid", customerId: user.id,
        }
    });
    if (!report) return { error: true, message: "Oupps il s'est passé quelque chose!", data: {} };
    const [deposit, aUpdate] = await prisma.$transaction([
        prisma.deposit.create({
            data: {
                account: account.id, amount: amount, createdAt: dayjs(Date.now()).format(),
                customer: user.id, madeby: user.role, payment: operatorChecker(phone), reportId: report.id
            }
        }),
        prisma.account.update({ where: { id: account.id }, data: { balance: account.balance + amount } }),
    ]);
    if (!aUpdate && !deposit) return { status: 400, message: "Erreur, Dépôt non éffectué", data: {} };
    await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
    return { status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit };
}

const validateAddBook = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: true, message: "User not found", data: {} };
    const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
    if (bookIsOpened) return { error: true, message: "Impossible de créer le carnet", data: {} };
    const [created_book, report_bet] = await prisma.$transaction([
        prisma.book.create({ data: { bookNumber: "", createdAt: dayjs(Date.now()).format(), userId: user.id, status: "opened", sheets: [] } }),
        prisma.betReport.create({ data: { goodnessbalance: 300, agentbalance: 0, createdat: dayjs(Date.now()).format(), agentId: user.agentId, customerId: user.id, type: "book" } }),
    ]);
    if (!created_book || !report_bet) return { error: true, message: "Cound not create", data: {} };
    const sheets = create_sheets(created_book, 300, dayjs(Date.now()).toDate());
    if (sheets) await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
    await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
    await agenda.start();
}

// Validate payment
export const hookValidateOrder = async (req: Request, res: Response) => {
    try {
        const schema = z.object({ token: z.string() });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: "Body must be completed by SEMOA CASHPAY CALLBACK", data: {} });
        const data = req.params.data;
        const transactionData = JSON.parse(atob(data));
        const token = validation.data.token;
        const tokendata = jwt.verify(token, process.env.SEMOA_API_KEY!, { algorithms: ["HS256"] }) as any;
        if (tokendata && tokendata.state == "Paid") {
            switch (transactionData.type) {
                case "deposit": validateDeposit(transactionData.userId, tokendata.amount, tokendata.client.phone); break;
                case "contribution": validateContribution(transactionData.userId, tokendata.amount, tokendata.client.phone); break;
                case "addbook": validateAddBook(transactionData.userId); break;
                default: break;
            }
        } else { return res.status(404).send({ error: true, message: "Invalid Token!", data: {} }); }
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
}



// const useraccount = await prisma.account.findFirst({ where: { userId: userData.userId } });
// if (!useraccount) return res.status(404).send({ error: true, message: "User Account not found", data: {} });
// let updated = await prisma.account.update({ where: { id: useraccount.id }, data: { balance: useraccount.balance + tokendata.amount } });
// await prisma.transaction.create({ data: { title: "Rechargement", amount: tokendata.amount.toString(), user: userData.userId, createdat: dayjs(Date.now()).format(), description: "Rechargement de compte" } });
// await supabase.from("account").upsert({ 'balance': updated.balance, id: useraccount.id }).eq("id", useraccount.id);
// return res.status(200).send({ error: false, message: "ok", data: updated });