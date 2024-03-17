import { Request, Response, request, response } from "express";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import { agenda, prisma } from "../server";
import { contribution_schema, create_sheets, operatorChecker, semoaCashPayGateway } from "../utils";
import { User } from "@prisma/client";
import { semoaCashPayHeader } from "../utils/headers";
import { fromZodError } from "zod-validation-error";
import axios from "axios";
import dayjs from "dayjs";
import { contributionEvent } from "./Contribution";



// Create Payment (Order)
export const hookCreateOrder = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            userId: z.string(),
            type: z.string(), // saving, tontine, addbook
            amount: z.number(),
            gateway: z.string(),
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
                    "lastname": user.id,
                    "firstname": user.user_name,
                    "phone": "+22897990733"
                    // "phone": `228${user.phone}`
                },
                "gateway_id": semoaCashPayGateway(validation.data.gateway),
                "callback_url": `https://goodapp.onrender.com/hook/order/validate/${data}`,
                // "callback_url": `https://goodapp-9c0o.onrender.com/hook/order/validate/${data}`,
                "redirect_url": "https://google.com",
            })
        };
        const response = await axios(config);
        if (!response) return res.status(400).send({ error: true, message: "...", data: {} });
        if (!(response.data.status == "success")) return res.status(400).send({ error: true, message: "Veuillez réssayer SVP !" });
        console.log(response.data);

        return res.status(200).send({
            error: false, message: "ok", data: {
                action: response.data["payments_method"][0].action ?? null, phone: user.phone, transaction: validation.data.type, gateway: validation.data.gateway,
                others: response.data,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
}

const validateContribution = async (customer: string, amount: number, phone: string) => {
    const payment_method = operatorChecker(phone);
    const schemaData: contribution_schema = { customer, amount, p_method: payment_method, createdAt: dayjs(Date.now()).toDate() }
    const user = await prisma.user.findUnique({ where: { id: customer } });
    if (!user) { console.log({ error: true, message: "User not found", data: {} }); return; };
    return await contributionEvent(request, response, user, schemaData, "mobilemoney");
}

const validateDeposit = async (userId: string, amount: number, phone: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { console.log({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} }); return; };
    const account = await prisma.account.findFirst({ where: { userId } });
    if (!account) { console.log({ error: true, status: 404, message: "Compte non trouvé", data: {} }); return; }
    const report = await prisma.report.create({
        data: {
            type: "deposit", amount: amount, createdat: dayjs(Date.now()).format(),
            payment: operatorChecker(phone), status: "unpaid", customerId: user.id,
        }
    });
    if (!report) { console.log({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} }); return };
    const [deposit, aUpdate] = await prisma.$transaction([
        prisma.deposit.create({
            data: {
                account: account.id, amount: amount, createdAt: dayjs(Date.now()).format(),
                customer: user.id, madeby: user.role, payment: operatorChecker(phone), reportId: report.id
            }
        }),
        prisma.account.update({ where: { id: account.id }, data: { balance: account.balance + amount } }),
    ]);
    if (!aUpdate && !deposit) { console.log({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} }); return };
    await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
    { console.log({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit }); return };
}

const validateAddBook = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { console.log({ error: true, message: "User not found", data: {} }); return; };
    const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
    if (bookIsOpened) { console.log({ error: true, message: "Impossible de créer le carnet", data: {} }); return };
    const [created_book, report_bet] = await prisma.$transaction([
        prisma.book.create({ data: { bookNumber: "", createdAt: dayjs(Date.now()).format(), userId: user.id, status: "opened", sheets: [] } }),
        prisma.betReport.create({ data: { goodnessbalance: 300, agentbalance: 0, createdat: dayjs(Date.now()).format(), agentId: user.agentId, customerId: user.id, type: "book" } }),
    ]);
    if (!created_book || !report_bet) { console.log({ error: true, message: "Cound not create", data: {} }); return };
    const sheets = create_sheets(created_book, 300, dayjs(Date.now()).toDate());
    if (sheets) {
        await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
        await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
    } else {
        console.log("Erreur inconnue"); return;
    }
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
        if (!tokendata) return res.status(403).send({ error: true, message: "You provide an invalid token", data: {} });
        console.log(tokendata);
        console.log(transactionData);
        if (tokendata && tokendata.state == "Paid") {
            console.log(transactionData);
            switch (transactionData.type) {
                case "tontine": validateContribution(transactionData.userId, tokendata.amount, tokendata.client.phone); break;
                case "saving": validateDeposit(transactionData.userId, tokendata.amount, tokendata.client.phone); break;
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