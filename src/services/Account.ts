import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { create_sheets } from "../utils";


export async function create_account(req: Request, res: Response) {
    try {
        // a refers to account
        const account_schema = z.object({
            a_number: z.string(),
            a_type: z.string(),
            amount: z.number().default(0.0),
            createdAt: z.coerce.date().min(new Date(), { message: "Too young!" }).max(new Date(), { message: "Too old!" }),
            user: z.string(),
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
                user: a_data.user
            }
        })
        return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data: { result: result.accountNumber } })
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
            createdAt: z.coerce.date().min(new Date(), { message: "Too young!" }).max(new Date(), { message: "Too old!" }),
            user: z.string(), // customer
            bet: z.number().min(300, "Montant de la mise invalide")
        });

        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        let b_data = validation_result.data;
        var created_book = await prisma.book.create({
            data: {
                bookNumber: b_data.b_number,
                createdAt: new Date(b_data.createdAt),
                customer: b_data.user,
                status: "notopened",
            }
        })
        const sheets = create_sheets(created_book, validation_result.data.bet, validation_result.data.createdAt);
        if (sheets) created_book = await prisma.book.update({
            where: { id: created_book.id },
            data: { sheets: sheets }
        })
        return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: { result: created_book } })
    } catch (err) {
        console.error(`Error while creating account`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}