import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { allContributions, all_category_products, close_sheets, create_sheets, customerContributions, empty_case, opened_book, opened_sheet, sendPushNotification, sheet_contribute, sheet_to_open, sheet_validate, update_case, update_sheets, userAgentContributions, utilisIsInt } from "../utils";
import { Contribution, Sheet, User } from "@prisma/client";

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
        })
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
        const bookOpenedVerification = await prisma.book.findFirst({ where: { status: "opened", customer: validation_result.data.customer } });
        if (bookOpenedVerification) return res.status(400).send({ error: true, message: "Vous ne pouvez pas encore créé de carnet", data: {} })
        var created_book = await prisma.book.create({
            data: {
                bookNumber: b_data.b_number,
                createdAt: new Date(b_data.createdAt),
                customer: b_data.customer,
                status: "opened",
                sheets: []
            }
        })
        const sheets = create_sheets(created_book, validation_result.data.bet, validation_result.data.createdAt);
        if (sheets) created_book = await prisma.book.update({
            where: { id: created_book.id },
            data: { sheets: sheets },
        });
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
        let books = await prisma.book.findMany({ where: { customer: user.id } });
        if (!books) return res.status(404).send({ error: true, message: "Aucun livre pour cet utilisateur", data: {} });
        return res.status(200).send({ error: false, message: "", data: books })
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
        const schema = z.object({
            bookid: z.string().nonempty(),
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message })
        const { user } = req.body.user as { user: User };
        let book = await prisma.book.findFirst({ where: { id: bookid, customer: user.id } });
        if (!book) return res.status(404).send({ error: true, message: "Livre non trouvé" });
        return res.status(200).send({ error: false, message: "", data: book });
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get book");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Carnet ouvert (courant ou actuel)
export async function get_opened_book(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        let book = await prisma.book.findFirst({ where: { status: "opened", customer: user.id } });
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
        return res.status(200).send({ error: sheet.error, message: sheet.message, data: sheet.data })
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
        });
        const validation_result = schema.safeParse(req.body);
        const { user } = req.body.user as { user: User };
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        const book = await opened_book(user);
        const sheets = await update_sheets(user, validation_result.data.openedAt, validation_result.data.bet);
        await prisma.book.update({ where: { id: book!.id }, data: { sheets: sheets.updated_sheets } });
        return res.status(200).send({ error: false, message: "Feuille ouverte", data: {} });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

// Trouver une feuille
export async function get_sheet(req: Request, res: Response) {
    try {
        const schema = z.object({
            b_id: z.string(),
            s_id: z.string(),
        });
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
        const schema = z.object({
            b_id: z.string(),
            s_id: z.string(),
            reason: z.string(),
            closedAt: z.coerce.date(),
        });

        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} })
        let data = validation_result.data;
        let targeted_book = await prisma.book.findUnique({ where: { id: data.b_id } });
        if (!targeted_book) return res.status(404).send({ error: true, message: "Book not found" });
        const target_sheet = close_sheets(targeted_book.sheets, data.s_id, data.closedAt, data.reason);
        if (target_sheet.error) return res.status(400).send({ error: true, message: target_sheet.message });
        targeted_book = await prisma.book.update({
            where: { id: data.b_id, }, data: { sheets: target_sheet.updated_sheets }
        });
        return res.status(201).send({ status: 201, error: false, message: 'Feuille bloquée', data: targeted_book, });
    } catch (err) {
        console.log(err);
        console.log("Error while closing sheet");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Cotiser
export async function contribute(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number(),
            createdAt: z.coerce.date(),
            p_method: z.string(),
        });
        const validation_result = schema.safeParse(req.body);
        const { user } = req.body.user as { user: User };
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        let data = validation_result.data;
        const book = await opened_book(user);
        var result = await sheet_contribute(user.id, data.amount, data.p_method);
        const userAccount = await prisma.account.findFirst({ where: { user: user.id } });
        var crtCtrtion: Contribution;
        if (!result.error) {
            crtCtrtion = await prisma.contribution.create({
                data: {
                    account: userAccount?.id!,
                    createdAt: data.createdAt,
                    userId: user.id,
                    pmethod: data.p_method,
                    status: "awaiting",
                    awaiting: "agent",
                    amount: data.amount,
                    cases: result.cases!,
                    agent: user.agentId
                },
            });
            if (crtCtrtion) {
                const userAgent = await prisma.user.findUnique({ where: { id: user.agentId! } });
                await prisma.book.update({ where: { id: book?.id! }, data: { sheets: result.updated_sheets! } });
                userAgent?.device_token! != "" ? await sendPushNotification(userAgent?.device_token!, "Cotisation", `${user.user_name} vient de cotiser la somme de ${data.amount} FCFA pour son compte tontine`) : {};
                return res.status(200).send({ error: false, message: "Cotisation éffectée", data: crtCtrtion! });
            } else {
                return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: crtCtrtion! });
            }
        } else {
            return res.status(200).send({ error: result.error, message: result.message, data: {} });
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

// Validate contribution
export async function validate_contribution(req: Request, res: Response) {
    try {
        const contribution = req.params.id;
        const { user } = req.body.user as { user: User };
        var targeted_contribution = await prisma.contribution.findFirst({ where: { id: contribution } });
        if (targeted_contribution) {
            const customer = await prisma.user.findUnique({ where: { id: targeted_contribution.userId! } });
            const status = user.role == "admin" ? "paid" : "awaiting";
            const book = await opened_book(customer!);
            var result = await sheet_validate(customer!, targeted_contribution.cases, status);
            var validated: Contribution;
            if (!result.error) {
                validated = await prisma.contribution.update({
                    where: { id: contribution },
                    data: {
                        awaiting: user.role == "agent" ? "admin" : "none",
                        status: user.role == "admin" ? "paid" : "awaiting",
                    }
                });
                if (validated) {
                    const targeted_acount = await prisma.account.findFirst({ where: { user: customer?.id! } });
                    await prisma.account.update({ where: { id: targeted_acount?.id! }, data: { amount: targeted_acount?.amount! + targeted_contribution.amount } });
                    await prisma.book.update({ where: { id: book?.id! }, data: { sheets: result.updated_sheets! } });
                    if (user.role == "admin" && customer?.device_token!) await sendPushNotification(customer?.device_token!, "Cotisation", `Votre cotisation en attente vient d'être validé`);
                    return res.status(200).send({ error: false, message: "Cotisation validée", data: validated! });
                } else {
                    return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} });
                }
            }
        } else {
            return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} });
        }
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Liste des cotisations utilisateurs
export async function user_contributions(req: Request, res: Response) {
    const { user } = req.body.user as { user: User };
    var contributions: Object[];
    switch (user.role) {
        case "customer":
            contributions = await customerContributions(user);
            break;
        case "agent":
            contributions = await userAgentContributions(user);
            break;
        case "admin":
            contributions = await allContributions();
            break;
        default:
            break;
    }
    return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions! })
}

// Trouver une cotisation
export async function target_contribution(req: Request, res: Response) {
    const contribution = req.params.id;
    var targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
    var targeted_user = await prisma.user.findUnique({ where: { id: targeted_contribution!.userId } });
    return res.status(200).send({ error: false, message: "Request end", data: { ...targeted_contribution, customer: JSON.stringify(targeted_user) } });
}

// Test for all
export const contribtest = async (req: Request, res: Response) => {
    // const { amount, openedAt } = req.body;
    // const { user } = req.body.user as { user: User };
    // const book = await prisma.book.findFirst({ where: { customer: user.id, status: "opened" } });
    // if (!book) res.status(400).send({ error: true, message: "Une erreur est survenue", data: {} });
    // var sheetToOpen: Sheet;
    // const findLastClosedSheet = book!.sheets.find((st) => st.status === "closed");
    // if (!findLastClosedSheet) {
    //     sheetToOpen = book!.sheets[0];
    // } else sheetToOpen = book!.sheets[findLastClosedSheet.index];
    // var updated_sheets = await update_sheets(user, openedAt, 500);
    // const schema = z.object({
    //     amount: z.number().min(300),
    //     createdAt: z.coerce.date(),
    //     p_method: z.string(),
    // });
    // const validation_result = schema.safeParse(req.body);
    // const { user } = req.body.user as { user: User };
    // if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
    // let data = validation_result.data;
    // // var sheet = await opened_sheet(user);
    // // var calc = data.amount / sheet.data?.bet!;
    // // const emptycase = await empty_case(user);
    // var result = await sheet_contribute(user, data.amount, "paid");
    // const book = await opened_book(user);
    await all_category_products("");
    return res.status(200).send({ data: {} });
}