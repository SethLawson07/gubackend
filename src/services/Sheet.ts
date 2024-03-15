import { Sheet, User } from "@prisma/client";
import { opened_book, opened_sheet, sheet_to_close, sheet_validation, update_sheets } from "../utils";
import { agenda, prisma } from "../server";
import { Request, Response } from "express";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

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
        const book = await opened_book(user.id);
        if (book.error || !book.book || !book.data) return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
        const sheets = await update_sheets(user, validation_result.data.openedAt, validation_result.data.bet);
        if (sheets.error) return res.status(400).send({ error: true, message: sheets.message, data: {} });
        await prisma.book.update({ where: { id: book.data.id }, data: { sheets: sheets.updated_sheets } });
        // await agenda.schedule('in 1 months, 1 days', 'closesheet', { book, sheet: sheets.sheet });
        await agenda.schedule('in 31 days', 'closesheet', { book: book.data, sheet: sheets.sheet });
        await agenda.start();
        return res.status(200).send({ error: false, message: "Feuille ouverte", data: {} });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
    }
}

// // Trouver une feuille
// export async function get_sheet(req: Request, res: Response) {
//     try {
//         const schema = z.object({ b_id: z.string(), s_id: z.string() });
//         const validation = schema.safeParse(req.body);
//         if (!validation.success) return res.status(404).send({ error: true, message: "Données non validées", data: {} });
//         const book = await prisma.book.findUnique({ where: { id: validation.data.b_id } });
//         if (!book) return res.status(404).send({ error: true, message: "Carnet non trouvé", data: {} });
//         const sheet = book.sheets.find((e) => e.id == validation.data.s_id);
//         if (!sheet) return res.status(404).send({ error: true, message: "", data: {} });
//         return res.status(200).send({ error: false, message: '', data: sheet });
//     } catch (err) {
//         console.log(err);
//         console.log("Error while getting sheets");
//         return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
//     }
// }

// Bloquer la feuile
export async function close_sheet(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        const book = await opened_book(user.id);
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
        updated_sheets[sheetIndex] = sheet;
        let update_book = await prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
        if (update_book && sheetToClose.data.index == 11) { update_book = await prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } }); }
        return res.status(200).send({ status: 201, error: false, message: 'Feuille bloquée', data: update_book, });
    } catch (err) {
        console.log(err);
        console.log("Error while closing sheet");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Close sheet on file
export const forceclosesheet = async (user: User) => {
    try {
        const book = await opened_book(user.id);
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

// Sheet cases Validation
export async function cases_valiation(req: Request, res: Response) {
    try {
        const schema = z.object({ amount: z.number().min(300) });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: "Amount required", data: {} });
        const data = validation.data;
        const { user } = req.body.user as { user: User };
        const result = await sheet_validation(user.id, data.amount);
        if (result.error) return res.status(400).send({ error: true, message: result.message, data: {} });
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}
