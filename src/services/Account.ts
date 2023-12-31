import { allContributions, create_sheets, customerContributions, opened_book, opened_sheet, operatorChecker, sendPushNotification, sheet_contribute, sheet_reject, sheet_to_close, sheet_validate, todateTime, update_sheets, userAgentContributions, utilsNonSpecifiedReport, utilsTotalReport } from "../utils";
import { Account, Book, Contribution, Sheet, User } from "@prisma/client";
import { validateContributionJobQueue } from "../queues/queues";
import { fromZodError } from 'zod-validation-error';
import { Request, Response } from "express";
import { store } from "../utils/store";
import { prisma } from "../server";
const Agenda = require('agenda');
import { z } from "zod";

const agenda = new Agenda();
agenda.database(process.env.DATABASE);

// Définition de la tâche
agenda.define('closebook', async (job: any) => {
    const { created_book } = job.attrs.data as { created_book: Book };
    await prisma.book.update({ where: { id: created_book.id }, data: { status: "closed" } });
});

// Définition de la tâche
agenda.define('closesheet', async (job: any) => {
    const { user, date } = job.attrs.data as { user: User, date: any };
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const sheetToClose = await sheet_to_close(user);
    if (sheetToClose.error || sheetToClose.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
    const sheet: Sheet = sheetToClose.data;
    // const sheet: Sheet = (await sheet_to_close(user))!;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    sheet.status = "closed";
    updated_sheets[sheetIndex] = sheet!;
    await prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
});

// Créer un compte tontine ou depot utilisateur
export async function create_account(req: Request, res: Response) {
    try {
        // a refers to account
        const account_schema = z.object({
            a_number: z.string(),
            a_type: z.string(),
            amount: z.number().default(0.0),
            createdAt: z.coerce.date(),
            customer: z.string(),
        });
        const validation_result = account_schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        let a_data = validation_result.data;
        const result = await prisma.account.create({
            data: {
                accountNumber: a_data.a_number,
                type: a_data.a_type,
                amount: a_data.amount,
                createdAt: new Date(a_data.createdAt),
                user: a_data.customer
            }
        });
        return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data: result });
    } catch (err) {
        console.error(`Error while creating account`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Créer un carnet
export async function create_book(req: Request, res: Response) {
    try {
        // b refers to book
        const schema = z.object({
            b_number: z.string(),
            createdAt: z.coerce.date(),
            customer: z.string(), // customer
            bet: z.number().min(300, "Montant de la mise invalide").default(300)
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        let b_data = validation_result.data;
        const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: validation_result.data.customer } });
        if (bookIsOpened) return res.status(400).send({ error: true, message: "Création de carnet impossible", data: {} })
        let created_book = await prisma.book.create({
            data: { bookNumber: b_data.b_number, createdAt: new Date(b_data.createdAt), userId: b_data.customer, status: "opened", sheets: [] }
        });
        const sheets = create_sheets(created_book, validation_result.data.bet, validation_result.data.createdAt);
        if (sheets) created_book = await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
        await agenda.schedule('in 372 days', 'closebook', { created_book });
        await agenda.start();
        return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: created_book })
    } catch (err) {
        console.log(err)
        console.error(`Error while creating book`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Liste de tous les carnets
export async function get_books(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        let books = await prisma.book.findMany({ where: { userId: user.id } });
        if (!books) return res.status(404).send({ error: true, message: "Aucun livre pour cet utilisateur", data: {} });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: books })
    } catch (err) {
        console.log(err);
        console.log("Error while getting books");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Trouver un carnet
export async function get_book(req: Request, res: Response) {
    try {
        let bookid = req.params.id;
        const { user } = req.body.user as { user: User };
        let book = await prisma.book.findUnique({ where: { id: bookid } });
        if (!book) return res.status(404).send({ error: true, message: "Carnet non trouvé" });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: book });
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get book");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Get Account
export async function get_account(req: Request, res: Response) {
    try {
        const accountid = req.params.id;
        const account = await prisma.account.findUnique({ where: { id: accountid } });
        if (!account) return res.status(404).send({ error: true, message: "Carnet non trouvé", data: {} });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: account });
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get account");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Get User Account
export async function get_user_account(req: Request, res: Response) {
    try {
        const userid = req.params.id;
        const targetted_user = await prisma.user.findUnique({ where: { id: userid } });
        if (!targetted_user) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const targetted_account = await prisma.account.findFirst({ where: { user: targetted_user.id, type: "tontine" } });
        if (!targetted_account) return res.status(404).send({ error: true, message: "Account not found", data: {} });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: targetted_account })
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get user account");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Carnet ouvert (courant ou actuel)
export async function get_opened_book(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        let book = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
        if (!book) return res.status(404).send({ error: true, message: "Aucun livre ouvert", data: {} });
        return res.status(200).send({ error: false, message: "", data: book });
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get book");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Trouver la feuille ouverte
export async function check_for_opened_sheet(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        const sheet = await opened_sheet(user);
        return res.status(200).send({ error: sheet.error, message: sheet.message, data: { ...sheet.data, book: sheet.book }, book: sheet.book });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: true, message: "Une erreur interne est survenue", data: {} });
    }
}

// Ouvrir une feuille
export async function open_sheet(req: Request, res: Response) {
    try {
        const schema = z.object({
            bet: z.number().min(300).default(300),
            openedAt: z.coerce.date(),
            userId: z.string(),
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        const user = await prisma.user.findUnique({ where: { id: validation_result.data.userId } });
        if (!user) return res.status(404).send({ error: true, message: "Utilisateur non trouvé", data: {} });
        const book = await opened_book(user);
        if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
        const sheets = await update_sheets(user, validation_result.data.openedAt, validation_result.data.bet);
        if (sheets.error) return res.status(400).send({ error: true, message: sheets.message, data: {} });
        await prisma.book.update({ where: { id: book.data.id }, data: { sheets: sheets.updated_sheets } });
        // await prisma.
        // await agenda.schedule('in 10 seconds', 'closesheet', { user, date: validation_result.data.openedAt });
        await agenda.schedule('in 31 days', 'closesheet', { user, date: validation_result.data.openedAt });
        await agenda.start();
        return res.status(200).send({ error: false, message: "Feuille ouverte", data: {} });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

// Trouver une feuille
export async function get_sheet(req: Request, res: Response) {
    try {
        const schema = z.object({ b_id: z.string(), s_id: z.string() });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(404).send({ error: true, message: "Données non validées", data: {} });
        const book = await prisma.book.findUnique({ where: { id: validation.data.b_id } });
        if (!book) return res.status(404).send({ error: true, message: "Carnet non trouvé", data: {} });
        const sheet = book.sheets.find((e) => e.id == validation.data.s_id);
        if (!sheet) return res.status(404).send({ error: true, message: "", data: {} });
        return res.status(200).send({ error: false, message: '', data: sheet });
    } catch (err) {
        console.log(err);
        console.log("Error while getting sheets");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Bloquer la feuile
export async function close_sheet(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        const book = await opened_book(user);
        if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
        const sheets = book.data.sheets;
        const sheetToClose = await sheet_to_close(user);
        if (sheetToClose.error || sheetToClose.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
        const sheet: Sheet = sheetToClose.data;
        let updated_sheets: Sheet[] = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        const awaitingContributions = await prisma.contribution.findMany({ where: { sheet: sheet.id, status: "awaiting" } });
        if (awaitingContributions.length > 0) { return res.status(400).send({ error: true, message: "Des cotisations sont en cours de validation" }) };
        const unpaidCases = sheet.cases.filter((e) => e.contributionStatus == "unpaid");
        if (unpaidCases && unpaidCases.length >= 31) { return res.status(400).send({ error: true, message: "Impossible de bloquer la feuille vierge" }) };
        sheet.status = "closed";
        updated_sheets[sheetIndex] = sheet!;
        const targeted_book = await prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
        return res.status(200).send({ status: 201, error: false, message: 'Feuille bloquée', data: targeted_book, });
    } catch (err) {
        console.log(err);
        console.log("Error while closing sheet");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Close sheet on file
const forceclosesheet = async (user: User) => {
    try {
        const book = await opened_book(user);
        if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
        const sheets = book.data.sheets;
        const sheetToClose = await sheet_to_close(user);
        if (sheetToClose.error || sheetToClose.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
        const sheet: Sheet = sheetToClose.data;
        let updated_sheets: Sheet[] = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        sheet.status = "closed";
        updated_sheets[sheetIndex] = sheet!;
        await prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
        return { error: false, message: "ok", data: {} };
    } catch (err) {
        console.log(err); console.log("Error while closing sheet");
        return false;
    }
}

// Close sheet on file
const forceclosebook = async (user: User) => {
    try {
        const book = await opened_book(user);
        if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
        await prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
        return { error: false, message: "ok", data: {} };
    } catch (err) {
        console.log(err); console.log("Error while closing sheet");
        return false;
    }
}

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
            const customerAccount = await prisma.account.findFirst({ where: { user: customer.id } });
            if (!customerAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = customerAccount;
        } else {
            targetted_account = (await prisma.account.findFirst({ where: { user: user.id } }))!;
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
                    cases: result.cases!.map(chiffre => chiffre + 1), status: "awaiting", agentId: userAgent!.id, customerId: targetted_user.id,
                }
            });
            if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
            contribution = await prisma.contribution.create({
                data: {
                    account: targetted_account?.id!, createdAt: data.createdAt, userId: targetted_user.id, pmethod: data.p_method, status: "awaiting", reportId: report.id,
                    awaiting: user.role == "agent" ? "admin" : "agent", amount: data.amount, cases: result.cases!.map(chiffre => chiffre + 1), agent: targetted_user.agentId, sheet: result.sheet!.id,
                },
            });
            if (contribution) {
                await prisma.book.update({ where: { id: book.data.id! }, data: { sheets: result.updated_sheets! } });
                user.role == "customer" && userAgent?.device_token! != "" ? await sendPushNotification(userAgent?.device_token!, "Cotisation", `${user.user_name} vient de cotiser la somme de ${data.amount} FCFA pour son compte tontine`) : {};
                return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution! });
            } else { return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: contribution! }); }
        } else {
            if (result.isSheetFull) { await forceclosesheet(user); return res.status(200).send({ error: result.error, message: result.message, data: { isSheetFull: true }, }); };
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
            const status = user.role == "admin" ? "paid" : "awaiting";
            const book = await opened_book(customer!);
            if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            let result = await sheet_validate(customer!, targeted_contribution.cases, status);
            if (!result.error) {
                const validated = await prisma.contribution.update({ where: { id: contribution }, data: { awaiting: user.role == "agent" ? "admin" : "none", status: status } });
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
            const status = user.role == "admin" ? "paid" : "awaiting";
            const book = await opened_book(customer!);
            if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            let result = await sheet_reject(customer!, targeted_contribution.cases);
            if (!result.error) {
                const validated = await prisma.contribution.update({ where: { id: contribution }, data: { awaiting: user.role == "agent" ? "admin" : "none", status: "rejected" } });
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
    const { user } = req.body.user as { user: User };
    let contributions: Object[];
    switch (user.role) {
        case "customer": contributions = await customerContributions(user); break;
        case "agent": contributions = await userAgentContributions(user); break;
        case "admin": contributions = await allContributions(); break;
        default: break;
    }
    return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions! })
}

// Trouver une cotisation
export async function target_contribution(req: Request, res: Response) {
    const contribution = req.params.id;
    let targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
    let targeted_user = await prisma.user.findUnique({ where: { id: targeted_contribution!.userId } });
    return res.status(200).send({ error: false, message: "Request end", data: { ...targeted_contribution, customer: targeted_user } });
}

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
            const findAccount = await prisma.account.findFirst({ where: { user: findUser.id } });
            if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
        } else {
            targetted_account = (await prisma.account.findFirst({ where: { user: user.id } }))!; targetted_user = user;
        }
        const report = await prisma.report.create({
            data: { type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid", agentId: targetted_user.agentId!, customerId: targetted_user.id, }
        });
        if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        const [deposit, aUpdate] = await prisma.$transaction([
            prisma.deposit.create({
                data: {
                    account: targetted_account.id, amount: validation.data.amount, createdAt: validation.data.createdAt, customer: targetted_user.id,
                    madeby: "agent", payment: validation.data.p_method, reportId: report.id
                }
            }),
            prisma.account.update({ where: { id: targetted_account.id }, data: { amount: targetted_account.amount + data.amount } }),
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
            const findAccount = await prisma.account.findFirst({ where: { user: findUser.id } });
            if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
            const report = await prisma.report.create({
                data: {
                    type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid",
                    agentId: targetted_user.agentId!, customerId: targetted_user.id,
                }
            });
            if (!report) return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
            const [deposit, aUpdate] = await prisma.$transaction([
                prisma.deposit.create({
                    data: {
                        account: targetted_account.id, amount: data.amount, createdAt: todateTime(data.createdAt), customer: targetted_user.id,
                        madeby: "agent", payment: operatorChecker(validation_result.data.cel_phone_num), reportId: report.id
                    }
                }),
                prisma.account.update({ where: { id: targetted_account.id }, data: { amount: targetted_account.amount + data.amount } }),
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

export const totalReport = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            value: z.string().default("total"),
            agent: z.array(z.string()),
            method: z.string().default(""),
            type: z.string().default("contribution"),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const data = validation.data;
        switch (data.value) {
            case "total":
                utilsTotalReport(data.type, data.agent, data.method); break;
            case "":
                utilsNonSpecifiedReport(data.type, data.agent, data.method); break;
            default: break;
        }
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
        const data = await prisma.report.findMany({
            where: user.role == "customer" ? { customerId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }
                : { agentId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }, include: { agent: true, customer: true }
        });
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export const userLastActivities = async (req: Request, res: Response) => {
    try {
        const { user } = req.body.user as { user: User };
        const data = await prisma.report.findMany({
            where: user.role == "customer" ? { customerId: user.id, } : { agentId: user.id }, include: { agent: true, customer: true },
            take: 3
        });
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.log(err); return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
}

export async function check(req: Request, res: Response) {
    const data = await prisma.book.findFirst({ where: { status: "opened", userId: "65901d12afb1fd43947f2838" } });

    return res.status(200).send({ data });
}