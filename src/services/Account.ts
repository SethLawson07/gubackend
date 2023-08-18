import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { close_sheets, create_sheets, update_case, update_sheets } from "../utils";
import { User } from "@prisma/client";


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
            bet: z.number().min(300, "Montant de la mise invalide")
        });

        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        let b_data = validation_result.data;
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


export async function open_sheet(req: Request, res: Response) {
    try {
        // b refers to book
        // s refers to sheet
        const schema = z.object({
            b_id: z.string().nonempty("Id carnet requis"),
            s_id: z.string().nonempty("Id feuille requis"),
            bet: z.number().min(300, "Montant de la mise invalide"), // customer
            openedAt: z.coerce.date(),
            customer: z.string().nonempty("Id client requis"),
        });

        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).message, data: {} });
        let data = validation_result.data;
        let targeted_book = await prisma.book.findFirst({ where: { id: data.b_id, customer: data.customer } });
        if (!targeted_book) return res.status(404).send({ error: true, message: "Book not found" });
        const target_sheet = update_sheets(targeted_book.sheets, data.s_id, data.openedAt, data.bet);
        if (target_sheet.error) return res.status(400).send({ error: true, message: target_sheet.message });
        targeted_book = await prisma.book.update({
            where: { id: data.b_id, }, data: { sheets: target_sheet.updated_sheets }
        });
        // targeted_book = await prisma.book.update
        return res.status(201).send({ status: 201, error: false, message: 'Carnet ouvert', data: targeted_book, })
    } catch (err) {
        console.log(err);
        console.log("Error while opening sheet");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
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
        // let ctb_status = data.p_method == "mobile_money" ? "paid" : "aawaiting"; // Contribution status
        // let cse_status = data.p_method == "mobile_money" ? "paid" : "awaiting"; // Case status
        let created_contrib = await prisma.contribution.create({
            data: {
                account: data.account,
                book: data.b_id,
                sheet: data.c_id,
                case: data.c_id,
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