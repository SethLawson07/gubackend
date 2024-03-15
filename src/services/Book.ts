import { Request, Response } from "express";
import { fromZodError } from "zod-validation-error";
import { agenda, prisma } from "../server";
import { create_sheets, opened_book } from "../utils";
import { z } from "zod";
import { User } from "@prisma/client";

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
        const tUser = await prisma.user.findUnique({ where: { id: b_data.customer } });
        if (!tUser) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: tUser.id } });
        if (bookIsOpened) return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
        const [created_book, report_bet] = await prisma.$transaction([
            prisma.book.create({ data: { bookNumber: b_data.b_number, createdAt: new Date(b_data.createdAt), userId: tUser.id, status: "opened", sheets: [] } }),
            prisma.betReport.create({ data: { goodnessbalance: 250, agentbalance: 50, createdat: b_data.createdAt, agentId: tUser.agentId, customerId: tUser.id, type: "book" } }),
        ]);
        if (!create_book || !report_bet) return res.status(400).send({ error: true, message: "Erreur interne", data: {} });
        const sheets = create_sheets(created_book, validation_result.data.bet, validation_result.data.createdAt);
        if (sheets) await prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
        await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
        await agenda.start();
        return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: created_book })
    } catch (err) {
        console.log(err)
        console.error(`Error while creating book`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Is User Book Opened ?
export async function userBookIsOpened(req: Request, res: Response) {
    try {
        const schema = z.object({ customer: z.string(), });
        const validation = schema.safeParse(req.params);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).details[0].message });
        const user = await prisma.user.findUnique({ where: { id: validation.data.customer } });
        if (!user) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
        if (bookIsOpened) return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
        return res.status(201).send({ status: 201, error: false, message: 'Possible', data: {} });
    } catch (err) {
        console.log(err)
        console.error(`Error while creating book`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// addbook
export async function addBook(req: Request, res: Response) {
    try {
        const schema = z.object({
            createdAt: z.coerce.date(),
            customer: z.string()
        });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        let b_data = validation_result.data;
        const { user } = req.body.user as { user: User };
        const bookIsOpened = await prisma.book.findFirst({ where: { status: "opened", userId: validation_result.data.customer } });
        if (bookIsOpened) return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
        const customer = await prisma.user.findUnique({ where: { id: b_data.customer } });
        if (!customer) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const account = await prisma.account.findFirst({ where: { userId: customer.id } });
        if (!account) return res.status(404).send({ error: true, message: "User account not found", data: {} });
        if (account.balance < 300) return res.status(403).send({ error: true, message: "Solde Goodpay inssufisant", data: {} });
        const [addedbook, debit] = await prisma.$transaction([
            prisma.book.create({ data: { bookNumber: "", createdAt: new Date(b_data.createdAt), userId: customer.id, status: "opened", sheets: [] } }),
            prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - 300 } }),
            prisma.betReport.create({ data: { goodnessbalance: 250, agentbalance: 50, createdat: b_data.createdAt, agentId: customer.agentId, customerId: customer.id, type: "book" } }),
        ]);
        const sheets = create_sheets(addedbook, 300, validation_result.data.createdAt);
        if (sheets) {
            await prisma.book.update({ where: { id: addedbook.id }, data: { sheets: sheets }, });
        }
        await agenda.schedule('in 1 years, 7 days', 'closebook', { created_book: addedbook });
        await agenda.start();
        return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: addedbook });
    } catch (err) {
        console.log(err)
        console.error(`Error while creating book`);
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

// Close book on file
export const forceclosebook = async (user: User) => {
    try {
        const book = await opened_book(user.id);
        if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
        await prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
        return { error: false, message: "ok", data: {} };
    } catch (err) {
        console.log(err); console.log("Error while closing sheet");
        return false;
    }
}