import { Request, Response } from "express";
import { prisma } from "../server";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { User } from "@prisma/client";
import { allContributions, contribution_schema, contribution_validation_schema, customerContributions, sendPushNotification, sheet_contribute, sheet_reject, sheet_validate, userAgentContributions } from "../utils";
import { forceclosebook } from "./Book";
import { forceclosesheet } from "./Sheet";

// Cotiser
export async function contribute(req: Request, res: Response) {
    try {
        const schema = z.object({
            customer: z.string(),
            amount: z.number(),
            p_method: z.string(),
            createdAt: z.coerce.date(),
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        const { user } = req.body.user as { user: User };
        let data = validation_result.data;
        return await contributionEvent(req, res, user, data, "directmethod");
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
            let result = await sheet_validate(customer!, targeted_contribution.cases, status);
            if (!result.error && result.cases) {
                const validated = await prisma.contribution.update({ where: { id: contribution }, data: { agent: customer.agentId, awaiting: user.role == "agent" ? "admin" : "none", status: status } });
                if (validated) {
                    return await contributionValidationEvent(
                        req, res, user,
                        { customer, targeted_contribution, user, result, schemadata: validation.data, validated, book: result.book.data }
                    );
                    // await validateContributionJobQueue.add("validateContribution", { customer, targeted_contribution, user, result, schemadata: validation.data, validated, book: result.book.data });
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
            let result = await sheet_reject(customer, targeted_contribution.cases);
            if (!result.error && result.cases) {
                await prisma.contribution.update({ where: { id: contribution }, data: { awaiting: user.role == "agent" ? "admin" : "none", status: "rejected" } });
                await prisma.report.update({ where: { id: targeted_contribution.reportId }, data: { status: "unpaid", agentId: customer.agentId } });
                await prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets } });
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

export const contributionEvent = async (
    req: Request,
    res: Response,
    user: User,
    data: contribution_schema,
    type: string,
) => {
    let result = await sheet_contribute(data.customer, data.amount, data.p_method);
    const agentId = user.role == "agent" ? user.id : user.agentId;
    if (!result.error && result.cases) {
        const report = await prisma.report.create({
            data: {
                type: "contribution",
                amount: data.amount,
                createdat: data.createdAt,
                payment: data.p_method,
                sheet: result.sheet!,
                cases: result.cases!.map(chiffre => chiffre + 1),
                status: "awaiting",
                customerId: data.customer, agentId
            }
        });
        if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        const contribution = await prisma.contribution.create({
            data: {
                createdAt: data.createdAt,
                userId: data.customer,
                pmethod: data.p_method,
                status: "awaiting",
                reportId: report.id,
                awaiting: user.role == "agent" ? "admin" : "agent",
                amount: data.amount,
                cases: result.cases!.map(chiffre => chiffre + 1),
                sheet: result.sheet!.id,
                agent: agentId,
            },
        });
        if (contribution) {
            switch (type) {
                case "directmethod":
                    await prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets } });
                    if (user.role == "customer") {
                        const agent = await prisma.user.findFirst({ where: { id: user.agentId! } }); if (!agent) return res.status(404).send({ error: true, message: "Agent not found", data: {} });
                        agent.device_token != "" ? await sendPushNotification(agent.device_token, "Cotisation", `${user.user_name} vient de cotiser la somme de ${data.amount} FCFA pour son compte tontine`) : {}
                    };
                    return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution });
                case "mobilemoney":
                    const user_acount = await prisma.account.findFirst({ where: { userId: data.customer } });
                    if (!user_acount) return console.log("Compte non trouvé");
                    let balance = (user_acount?.balance! + data.amount);
                    const cases = (result.cases as number[]).map(chiffre => chiffre + 1);
                    if (cases.includes(1)) {
                        prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet!) } });
                    } else { await prisma.account.update({ where: { id: user_acount.id }, data: { balance } }); }
                    await prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets! } });
                    await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
                    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: "paid" } });
                default:
                    break;
            }
        } else {
            return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: contribution! });
        }
    } else {
        if (result.isSheetFull) {
            await forceclosesheet(user);
            return res.status(200).send({ error: result.error, message: result.message, data: { isSheetFull: true }, });
        };
        if (result.isBookFull) {
            await forceclosebook(user);
            return res.status(200).send({ error: result.error, message: result.message, data: { isBookFull: true }, });
        };
        return res.status(200).send({ error: result.error, message: result.message, data: {} });
    }
}

export const contributionValidationEvent = async (
    req: Request,
    res: Response,
    user: User,
    data: contribution_validation_schema,
) => {
    const { customer, targeted_contribution, result, schemadata, validated, book } = data;
    const user_acount = await prisma.account.findFirst({ where: { userId: customer.id } });
    if (!user_acount) return res.status(404).send({ error: true, message: "Utilisateur non trouvé", data: {} });
    let balance = (user_acount?.balance! + targeted_contribution.amount);
    if (user.role == "admin") {
        if (result.cases.includes(1)) {
            const agent_benefit = result.sheet.bet! * 0.2;
            const [uaUpdate, report_bet] = await prisma.$transaction([
                prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet!) } }),
                prisma.betReport.create({
                    data: {
                        goodnessbalance: result.sheet.bet! - agent_benefit, agentbalance: agent_benefit, createdat: schemadata.validatedat,
                        agentId: customer.agentId, customerId: customer.id, type: "bet"
                    }
                }),
            ]);
            if (!uaUpdate || !report_bet) return res.status(403).send({ error: true, message: "Cotisation non validée", data: {} });
        }
        else { await prisma.account.update({ where: { id: user_acount.id }, data: { balance } }); }
    }
    await prisma.book.update({ where: { id: book.id }, data: { sheets: result.updated_sheets! } });
    await prisma.report.update({ where: { id: validated.reportId }, data: { agentId: customer.agentId, status: validated.status, } });
    if (user.role == "admin" && customer?.device_token!) { await sendPushNotification(customer?.device_token!, "Cotisation", `Votre cotisation en attente vient d'être validé`); };
    return res.status(200).send({ status: 200, error: false, message: "Cotisation validée", data: validated });
}