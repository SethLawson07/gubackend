import { Request, Response } from "express";
import { prisma } from "../server";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { Account, Contribution, User } from "@prisma/client";
import { allContributions, customerContributions, opened_book, sendPushNotification, sheet_contribute, sheet_reject, sheet_to_open, sheet_validate, userAgentContributions } from "../utils";
import { forceclosebook } from "./Book";
import { forceclosesheet } from "./Sheet";
import { validateContributionJobQueue } from "../queues/queues";

// Cotiser
export async function contribute(req: Request, res: Response) {
    try {
        const schema = z.object({
            customer: z.string().min(1),
            amount: z.number(),
            p_method: z.string(),
            createdAt: z.coerce.date(),
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        const { user } = req.body.user as { user: User };
        let data = validation_result.data;
        let targetted_user: User;
        let targetted_account: Account;
        if (user.role == "agent") {
            const customer = await prisma.user.findUnique({ where: { id: data.customer } });
            if (!customer) return res.status(404).send({ error: true, status: 404, message: "Utilisateur non trouvé", data: {} });
            targetted_user = customer;
            const customerAccount = await prisma.account.findFirst({ where: { userId: customer.id } });
            if (!customerAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = customerAccount;
        } else {
            targetted_account = (await prisma.account.findFirst({ where: { userId: user.id } }))!;
            targetted_user = user;
        }
        const userAgent = await prisma.user.findUnique({ where: { id: targetted_user.agentId! } });
        if (!userAgent) return res.status(404).send({ error: true, message: "Agent not found", data: {} })
        const book = await opened_book(targetted_user);
        if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
        let result = await sheet_contribute(targetted_user.id, data.amount, data.p_method);

        let contribution: Contribution;
        if (!result.error) {
            const report = await prisma.report.create({
                data: {
                    type: "contribution", amount: data.amount, createdat: data.createdAt, payment: data.p_method, sheet: result.sheet!,
                    cases: result.cases!.map(chiffre => chiffre + 1), status: "awaiting", customerId: targetted_user.id,
                    agentId: user.role == "agent" ? user.id : null,
                }
            });
            if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
            contribution = await prisma.contribution.create({
                data: {
                    account: targetted_account?.id!, createdAt: data.createdAt, userId: targetted_user.id, pmethod: data.p_method, status: "awaiting", reportId: report.id,
                    awaiting: user.role == "agent" ? "admin" : "agent", amount: data.amount, cases: result.cases!.map(chiffre => chiffre + 1), sheet: result.sheet!.id, agent: targetted_user.agentId,
                },
            });
            if (contribution) {
                await prisma.book.update({ where: { id: book.data.id! }, data: { sheets: result.updated_sheets } });
                user.role == "customer" && userAgent?.device_token! != "" ? await sendPushNotification(userAgent?.device_token!, "Cotisation", `${user.user_name} vient de cotiser la somme de ${data.amount} FCFA pour son compte tontine`) : {};
                return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution });
            } else { return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: contribution! }); }
        } else {
            if (result.isSheetFull) {
                await forceclosesheet(user); return res.status(200).send({ error: result.error, message: result.message, data: { isSheetFull: true }, });
            };
            if (result.isBookFull) { await forceclosebook(user); return res.status(200).send({ error: result.error, message: result.message, data: { isBookFull: true }, }); };
            return res.status(200).send({ error: result.error, message: result.message, data: {} });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

// Validate contribution
export async function validate_contribution(req: Request, res: Response) {
    try {
        const contribution = req.params.id;
        const schema = z.object({ validatedat: z.coerce.date(), });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const { user } = req.body.user as { user: User };
        let targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
        if (targeted_contribution) {
            const customer = await prisma.user.findUnique({ where: { id: targeted_contribution.userId! } });
            if (!customer) return res.status(404).send({ error: true, message: "Customer not found" });
            const status = user.role == "admin" ? "paid" : "awaiting";
            const book = await opened_book(customer!);
            if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            let result = await sheet_validate(customer!, targeted_contribution.cases, status);
            if (!result.error) {
                const validated = await prisma.contribution.update({ where: { id: contribution }, data: { agent: customer.agentId, awaiting: user.role == "agent" ? "admin" : "none", status: status } });
                if (validated) {
                    await validateContributionJobQueue.add("validateContribution", { customer, targeted_contribution, user, result, schemadata: validation.data, validated, book });
                    return res.status(200).send({ status: 200, error: false, message: "Cotisation validée", data: validated! });
                } else { return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} }); }
            }
        } else { return res.status(401).send({ error: true, message: "Ressources non trouvées", data: {} }); }
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Reject contribution
export async function reject_contribution(req: Request, res: Response) {
    try {
        const contribution = req.params.id;
        const schema = z.object({ validatedat: z.coerce.date(), });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const { user } = req.body.user as { user: User };
        let targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
        if (targeted_contribution) {
            const customer = await prisma.user.findUnique({ where: { id: targeted_contribution.userId! } });
            if (!customer) return res.status(404).send({ error: true, message: "User not found", data: {} });
            const book = await opened_book(customer);
            if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            let result = await sheet_reject(customer, targeted_contribution.cases);
            if (!result.error) {
                await prisma.contribution.update({ where: { id: contribution }, data: { awaiting: user.role == "agent" ? "admin" : "none", status: "rejected" } });
                await prisma.report.update({ where: { id: targeted_contribution.reportId }, data: { status: "unpaid", agentId: customer.agentId } });
                await prisma.book.update({ where: { id: book.data.id }, data: { sheets: result.updated_sheets } });
                if (customer.device_token) { await sendPushNotification(customer.device_token, "Cotisation", `Votre cotisation a été rejetée`); };
                return res.status(200).send({ error: false, message: "Cotisation rejetée", data: {} });
            } else {
                return res.status(400).send({ error: result.error, message: result.message, data: {} });
            }
        } else { return res.status(401).send({ error: true, message: "Ressources non trouvées", data: {} }); }
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}



// Liste des cotisations utilisateurs
export async function agent_rejected_contributions(req: Request, res: Response) {
    const schema = z.object({ userId: z.string() });
    const validation = schema.safeParse(req.params);
    if (!validation.success) return res.status(400).send({ error: true, message: "User Id is needed", data: {} });
    const data = validation.data;
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) return res.status(404).send({ error: true, message: "User not found", data: {} });
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false };
    const sheet = await sheet_to_open(user);
    if (sheet.error || sheet.data == null) return { error: true, message: sheet.message, book: true, update_sheets: null };
    const contributions = await prisma.contribution.findMany({ where: { status: "rejected", userId: user.id, sheet: sheet.data.id } });
    return res.status(200).send({ error: false, message: "Requête aboutie", data: { contributions, book: sheet.book } });
}

// Liste des cotisations utilisateurs
export async function user_contributions(req: Request, res: Response) {
    const schema = z.object({
        status: z.string().default("awaiting"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        userId: z.string().default("all"),
    });
    const validation = schema.safeParse(req.body);
    if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
    const { user } = req.body.user as { user: User };
    let contributions: Object[];
    switch (user.role) {
        case "customer": contributions = await customerContributions(user); break;
        case "agent": contributions = await userAgentContributions(user); break;
        case "admin": contributions = await allContributions(validation.data); break;
        default: break;
    }
    return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions! })
}

// Liste des cotisations utilisateurs
export async function contributions_agent(req: Request, res: Response) {
    const schema = z.object({ type: z.string().default("all") });
    const validation = schema.safeParse(req.body);
    if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
    const data = validation.data;
    const { user } = req.body.user as { user: User };
    const contributions = await prisma.contribution.findMany({ where: { agent: user.id, status: data.type == "all" ? { in: ["paid", "unpaid", "awaiting", "rejected"] } : data.type }, include: { customer: true } });
    return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions })
}

// Trouver une cotisation
export async function target_contribution(req: Request, res: Response) {
    const contribution = req.params.id;
    let targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
    let targeted_user = await prisma.user.findUnique({ where: { id: targeted_contribution!.userId } });
    return res.status(200).send({ error: false, message: "Request end", data: { ...targeted_contribution, customer: targeted_user } });
}


// Get user contributions
export const userContributions = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userid;
        const contributions = await prisma.contribution.findMany({ where: { userId: userId }, include: { customer: true } });
        return res.status(200).send({ error: false, data: contributions, message: "ok" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}