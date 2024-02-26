import { fromZodError } from 'zod-validation-error';
import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";


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
            data: { number: a_data.a_number, type: a_data.a_type, balance: a_data.amount, createdAt: new Date(a_data.createdAt), userId: a_data.customer }
        });
        return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data: result });
    } catch (err) {
        console.error(`Error while creating account`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

// Créer un compte tontine ou depot utilisateur
export async function user_has_account(req: Request, res: Response) {
    try {
        const account_schema = z.object({
            userid: z.string(),
        });
        let data = false;
        const validation_result = account_schema.safeParse(req.params);
        if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error).details[0].message });
        const account = await prisma.account.findFirst({ where: { userId: validation_result.data.userid } });
        if (account) { data = true }
        return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data });
    } catch (err) {
        console.error(`Error while creating account`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
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
        const targetted_account = await prisma.account.findFirst({ where: { userId: targetted_user.id, type: "tontine" } });
        if (!targetted_account) return res.status(404).send({ error: true, message: "Account not found", data: {} });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: targetted_account })
    } catch (err) {
        console.log(err);
        console.log("Error while trying to get user account");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// pay with Goodpay
export async function pay_goodpay(req: Request, res: Response) {
    try {
        const schema = z.object({
            userid: z.string().nonempty("Id utilisateur requis"),
            amount: z.number().nonnegative("Montant invalide"),
            litpay: z.boolean().default(false),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).details[0].message, data: {} });
        const data = validation.data;
        const account = await prisma.account.findFirst({ where: { userId: data.userid } });
        if (!account) return res.status(404).send({ error: true, message: "Vous n'avez pas de compte Goodpay", data: {} });
        const p_validation = account.balance - data.amount;
        if (p_validation >= 0 || (p_validation < 0 && data.litpay)) {
            await prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - data.amount } });
            return res.status(404).send({ error: false, message: "Paiement éffectué", data: {} });
        } else { return res.status(400).send({ error: true, message: "Solde insuffisant", data: {} }); }
    } catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
}