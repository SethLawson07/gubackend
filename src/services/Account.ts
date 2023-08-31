import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { close_sheets, create_sheets, empty_case, opened_book, opened_sheet, sendPushNotification, sheet_contribute, sheet_to_open, update_case, update_sheets, utilisIsInt } from "../utils";
import { Contribution, Sheet, User } from "@prisma/client";


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


export async function get_book(req: Request, res: Response) {
    try {
        let bookid = req.params.id;
        const { user } = req.body.user as { user: User };
        let book = await prisma.book.findUnique({ where: { id: bookid } });
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
        const sheets = await update_sheets(user, validation_result.data.openedAt, 500);
        await prisma.book.update({ where: { id: book!.id }, data: { sheets: sheets.updated_sheets } });
        return res.status(200).send({ error: false, message: "Feuille ouverte", data: {} });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

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
        var result = await sheet_contribute(user, data.amount);
        const userAccount = await prisma.account.findFirst({ where: { user: user.id } });
        var crtCtrtion: Contribution;
        if (!result.error) {
            await prisma.book.update({ where: { id: book?.id! }, data: { sheets: result.updated_sheets! } });
            crtCtrtion = await prisma.contribution.create({
                data: {
                    account: userAccount?.id!,
                    createdAt: data.createdAt,
                    customer: user.id,
                    paymentmethod: data.p_method,
                    status: "aawaiting",
                    agent: user.agentId
                }
            });
            return res.status(200).send({ error: false, message: "Cotisation éffectée", data: crtCtrtion! });
        } else {
            return res.status(200).send({ error: result.error, message: result.message, data: {} });
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}


export async function make_contribution(req: Request, res: Response) {
    try {
        const schema = z.object({
            b_id: z.string(),
            s_id: z.string(),
            c_id: z.string(),
            account: z.string(),
            amount: z.number(),
            createdAt: z.coerce.date(),
            p_method: z.string(),
        });

        const validation_result = schema.safeParse(req.body);
        const { user } = req.body.user as { user: User };
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        let data = validation_result.data;
        let targeted_book = await prisma.book.findUnique({ where: { id: data.b_id } });
        if (!targeted_book) return res.status(404).send({ error: true, message: "Book not found" });
        let created_contrib = await prisma.contribution.create({
            data: {
                account: data.account,
                // book: data.b_id,
                // sheet: data.c_id,
                // case: data.c_id,
                createdAt: data.createdAt,
                customer: user.id,
                paymentmethod: data.p_method,
                status: "aawaiting",
                agent: user.agentId
            }
        });
        if (created_contrib) {
            const target_sheet = update_case(targeted_book.sheets, data.s_id, data.c_id, "awaiting");
            if (target_sheet.error) return res.status(400).send({ error: true, message: target_sheet.message });
            await prisma.book.update({ where: { id: data.b_id, }, data: { sheets: target_sheet.updated_sheets } });
            let targeted_agent = await prisma.user.findFirst({ where: { id: user.agentId! } });
            if (targeted_agent) { await sendPushNotification(targeted_agent.device_token, "Demande de cotisation", `Le client ${user.user_name} vient de cotiser`) };
            return res.status(201).send({ status: 201, error: false, message: 'Feuille bloquée', data: targeted_book, });
        }
        return res.status(400).send({ error: true, message: "Une erreur s'est produite", data: {}, });
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function validate_contribution(req: Request, res: Response) {
    try {
        const schema = z.object({
            b_id: z.string(),
            s_id: z.string(),
            c_id: z.string(),
            amount: z.number(),
            createdAt: z.coerce.date(),
            p_method: z.string(),
        });

        const validation_result = schema.safeParse(req.body);
        const user = req.body.user;
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}


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
    const schema = z.object({
        amount: z.number().min(300),
        createdAt: z.coerce.date(),
        p_method: z.string(),
    });
    const validation_result = schema.safeParse(req.body);
    const { user } = req.body.user as { user: User };
    if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
    let data = validation_result.data;
    // var sheet = await opened_sheet(user);
    // var calc = data.amount / sheet.data?.bet!;
    // const emptycase = await empty_case(user);
    var result = await sheet_contribute(user, data.amount);
    return res.status(200).send({ data: result });
}