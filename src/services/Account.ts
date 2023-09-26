import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { allContributions, all_category_products, close_sheets, create_sheets, customerContributions, empty_case, opened_book, opened_sheet, sendPushNotification, sheet_contribute, sheet_to_open, sheet_validate, update_case, update_sheets, userAgentContributions, utilisIsInt } from "../utils";
import { Account, Contribution, Sheet, User } from "@prisma/client";
import dayjs from "dayjs";
import { store } from "../utils/store";

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
                await prisma.transaction.create({
                    data: {
                        amount: data.amount,
                        date: (new Date(data.createdAt).toDateString()),
                        user: user.id,
                        detail: `Cotisation de ${data.amount} en cours de validation`
                    }
                });
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
        var targeted_contribution = await prisma.contribution.findUnique({ where: { id: contribution } });
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
                    var amount = (targeted_acount?.amount! + targeted_contribution.amount);
                    if (user.role == "admin") await prisma.account.update({ where: { id: targeted_acount?.id! }, data: { amount: amount } });
                    await prisma.book.update({ where: { id: book?.id! }, data: { sheets: result.updated_sheets! } });
                    if (user.role == "admin" && customer?.device_token!) await sendPushNotification(customer?.device_token!, "Cotisation", `Votre cotisation en attente vient d'être validé`);
                    await prisma.transaction.create({
                        data: {
                            amount: targeted_contribution.amount,
                            date: (new Date()).toDateString(),
                            user: user.id,
                            detail: `Validation de cotisation de ${customer?.user_name}`
                        }
                    });
                    return res.status(200).send({ status: 200, error: false, message: "Cotisation validée", data: validated! });
                } else {
                    return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} });
                }
            }
        } else {
            return res.status(401).send({ error: true, message: "Ressources non trouvées", data: {} });
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
        let targetted_user: User;
        let targetted_account: Account;
        console.log(user.role);
        if (user.role == "agent") {
            const findUser = await prisma.user.findUnique({ where: { id: validation.data.customer } });
            if (!findUser) return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
            targetted_user = findUser;
            const findAccount = await prisma.account.findFirst({ where: { user: findUser.id } });
            if (!findAccount) return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
        } else {
            targetted_account = (await prisma.account.findFirst({ where: { user: user.id } }))!;
            targetted_user = user;
        }
        let transaction = await prisma.account.update({
            where: { id: targetted_account.id }, data: { amount: targetted_account.amount + validation.data.amount }
        })
        if (!transaction) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} })
        const deposit = await prisma.deposit.create({
            data: {
                account: targetted_account.id,
                amount: validation.data.amount,
                createdAt: validation.data.createdAt,
                customer: targetted_user.id,
                madeby: user.role,
                payment: validation.data.p_method,
            }
        });
        if (!deposit) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
        await prisma.transaction.create({
            data: {
                amount: validation.data.amount,
                date: (new Date(validation.data.createdAt).toDateString()),
                user: targetted_user.id,
                detail: `Dépôt de ${validation.data.amount} FCFA`
            }
        });
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
        console.log(data);
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) {
            console.log(`Error while parsing response from cinet pay ${req.body}`)
            return res.status(500).send()
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
            let transaction = await prisma.account.update({
                where: { id: targetted_account.id }, data: { amount: targetted_account.amount + data.amount }
            })
            if (!transaction) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} })
            const deposit = await prisma.deposit.create({
                data: {
                    account: targetted_account.id,
                    amount: data.amount,
                    createdAt: new Date(dayjs(data.createdAt).format("MM/DD/YYYY")),
                    customer: targetted_user.id,
                    madeby: targetted_user.role,
                    payment: data.p_method,
                }
            });
            if (!deposit) return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
            await prisma.transaction.create({
                data: {
                    amount: data.amount,
                    date: (new Date(data.createdAt).toDateString()),
                    user: targetted_user.id,
                    detail: `Dépôt de ${data.amount} FCFA`
                }
            });
            return res.status(200).send({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
        }
        console.log(`A payment failed`)
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
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