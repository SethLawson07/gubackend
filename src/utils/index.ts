import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { prisma } from "../server";
import * as crypto from "crypto";
import axios from "axios";
import { Book, Case, Contribution, Item, Product, Sheet, User } from "@prisma/client";
import { ObjectId } from "bson";
import { json } from "express";
import admin from "firebase-admin";
import serviceAccount from '../token/goodpay-86d48-c5c79b945b8f.json';
import { MessagingPayload, TokenMessage } from "firebase-admin/lib/messaging/messaging-api";
import dayjs from "dayjs";

//
const firebaseServiceAccountParams = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url,
    universeDomain: serviceAccount.universe_domain
}

admin.initializeApp({ credential: admin.credential.cert(firebaseServiceAccountParams) });
const JWT_TOKEN = "goodnessunitsupertoken";
const salt_rounds = 10;

export function hash_pwd(plain_text_password: string) {
    return bcrypt.hashSync(plain_text_password, salt_rounds);
}

export function password_is_valid(plain_text_password: string, db_hash: string) {
    return bcrypt.compareSync(plain_text_password, db_hash);
}

type user_data = {
    is_admin: boolean;
    role: string;
    user_name: string;
    email?: string | null;
    phone: string;
    profile_picture: string;
}

export function sign_token(user: user_data) {
    return jwt.sign({ user }, JWT_TOKEN, { expiresIn: "31d" });
}

export function verify_token(token: string) {
    try {
        const { user } = jwt.verify(token, JWT_TOKEN) as { user: User };
        return { user, is_admin: user.is_admin };
    } catch (err) {
        console.error(`Error while verifying token ${err}`);
        return "";
    }
}

export async function generate_payment_link(amount: number, user: string, order_id: string) {
    const transaction_id = crypto.randomUUID()
    const data = {
        "apikey": "25443723563ef760b99c2b5.76392442",
        "site_id": "636165",
        "transaction_id": transaction_id,
        "amount": amount,
        "currency": "XOF",
        "description": "Reglement de commande",
        "customer_id": user,
        "notify_url": `https://goodapp-58a63c81a10c.herokuapp.com/hook/payment_event/${order_id}`,
        "return_url": "https://google.com",
        "channels": "ALL",
        "lang": "FR"
    }
    const payment_request_response = await axios.post(
        "https://api-checkout.cinetpay.com/v2/payment",
        data
    ).then(res => {
        if (res.status !== 200) {
            console.log(`Error while getting payment url`);
            return { status: false, url: "" };
        }
        const response = res.data as { data: { payment_url: string } };
        return { status: true, url: response.data.payment_url };
    })
    return payment_request_response;
}

export async function create_promocode_usage(promocodes: string[], user: string) {
    promocodes.map(async (code) => {
        await prisma.promoCodeUsage.create({ data: { code, user } });
    })
}

export function utilisIsInt(n: number) {
    return Number(n) === n && n % 1 === 0;
}

export function utilsIsFloat(n: number) {
    return Number(n) === n && n % 1 !== 0;
}

export function geneObjectId() { return (new ObjectId()).toString(); }

export const create_sheets = (book: Book, bet: number, date: Date): Sheet[] => {
    return Array.from({ length: 12 }, (_, index) => {
        const sheetId = geneObjectId();
        const sheet = {
            id: sheetId,
            createdAt: date,
            cases: create_cases(sheetId),
            bet: bet,
            book: book.id,
            status: "notopened",
            index: index,
        } as Sheet;
        return sheet;
    }) as Sheet[];
}

export function create_cases(sheet: string): Case[] {
    return Array.from({ length: 31 }, (_, index) => {
        const _case = {
            id: geneObjectId(),
            contributionStatus: "unpaid",
            sheet: sheet,
            index: index,
        } as Case;
        return _case;
    }) as Case[];
}

// Carnet ouver
export async function opened_book(user: User) {
    return await prisma.book.findFirst({ where: { customer: user.id, status: "opened" } });
}

// Feuille ouverte
export async function opened_sheet(user: User) {
    const book = await opened_book(user);
    var sheetOpened = book!.sheets.find((st) => st.status === "opened");
    if (!sheetOpened) return { error: true, message: "Aucune feuille ouverte" }
    return { error: false, message: "", data: sheetOpened as Sheet };
}

// Case remplie
export async function empty_case(user: User) {
    const book = await opened_book(user);
    var lastContributedCase: Case;
    var sheetOpened = book!.sheets.find((st) => st.status === "opened");
    if (!sheetOpened) return { error: true, message: "Aucune feuille ouverte" }
    // const lctCase = sheetOpened.cases.findLast(cse => cse.contributionStatus == ("paid" || "awaiting")); // lct for LastContributedCase
    const lctCase = sheetOpened.cases.find(cse => cse.contributionStatus == "unpaid"); // lct for LastContributedCase || First unpaid case
    if (!lctCase || lctCase == undefined) {
        if (sheetOpened.cases[30].contributionStatus == "paid" || "awaiting") {
            sheetOpened.cases[30].index = 31; // Fake case Index (Just for bypass verification ...)
            lastContributedCase = sheetOpened.cases[30]
        } else lastContributedCase = sheetOpened.cases[0];
    } else lastContributedCase = sheetOpened.cases[lctCase.index];
    return { error: false, data: lastContributedCase as Case };
}

// Feuille à ouvrir
export async function sheet_to_open(user: User) {
    var book = (await opened_book(user));
    var sheetToOpen: Sheet;
    const findLastClosedSheet = book!.sheets.findLast((st) => st.status === "closed");
    if (!findLastClosedSheet) {
        sheetToOpen = book!.sheets[0];
    } else sheetToOpen = book!.sheets[findLastClosedSheet.index + 1];
    return { error: false, data: sheetToOpen };
}

// Open sheet
export async function update_sheets(user: User, openedat: Date, bet: number) {
    let error: boolean = false;
    let message: string = "";
    console.log((await opened_book(user)));
    const sheets = (await opened_book(user))!.sheets;
    console.log(sheets);
    const sheet: Sheet = (await sheet_to_open(user)).data;
    let updated_sheets: Sheet[] = (await opened_book(user))!.sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    if (sheet) {
        if (sheetIndex == 0) { sheet.status = "opened"; sheet.openedAt = new Date(openedat); sheet.bet = bet }
        else {
            if (sheets[sheetIndex - 1].status == "notopened") error = true; message = "Feuille actuelle non ouverte";
            if (sheets[sheetIndex - 1].status == "opened") error = true; message = "Feuille actuelle non bloquée";
            if (sheets[sheetIndex - 1].status === "closed") {
                sheet.status = "opened"; sheet.openedAt = new Date(openedat); sheet.bet = bet;
            }
        }
    } else { error = true, message = "Vous ne pouvez pas encore créer de feuille" }
    updated_sheets[sheetIndex] = sheet!;
    return { error, message, updated_sheets };
}

// Update sheet for contribution (Method: agent)
export async function sheet_contribute(userid: string, amount: number, pmethod: string) {
    const user = (await prisma.user.findUnique({ where: { id: userid } }))!;
    const status = pmethod === "agent" ? "awaiting" : "paid";
    let error: boolean = false;
    let message: string = "";
    const sheets = (await opened_book(user))!.sheets;
    const sheet: Sheet = (await sheet_to_open(user)).data;
    let updated_sheets: Sheet[] = (await opened_book(user))!.sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const emptycase: Case = (await empty_case(user)).data!;
    var nbCases = amount / sheet.bet!;
    if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide" };
    if (emptycase.index == 31) return { error: true, message: "Votre carnet est remplie" };
    if (emptycase.index + nbCases > 31) return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)` };
    let cases = [];
    for (let i = 0; i < nbCases; i++) {
        sheet.cases[i + emptycase.index].contributionStatus = status;
        cases.push((emptycase.index + i));
    };
    updated_sheets[sheetIndex] = sheet!;
    return { error, message, updated_sheets, cases };
}

// Update sheet for contribution (Method: agent)
export async function sheet_validate(user: User, cases: number[], status: string) {
    let error: boolean = false;
    let message: string = "";
    const sheets = (await opened_book(user))!.sheets;
    const sheet: Sheet = (await sheet_to_open(user)).data;
    let updated_sheets: Sheet[] = (await opened_book(user))!.sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    for (let i = 0; i < cases.length; i++) sheet.cases[cases[i]].contributionStatus = status;
    updated_sheets[sheetIndex] = sheet!;
    return { error, message, updated_sheets };
}

// // Update sheet for contribution (Method: agent)
// export async function sheet_contribute(user: User, amount: number, status: string) {
//     const targeted_user = await prisma.user.findUnique({ where: { id: user } });
//     let error: boolean = false;
//     let message: string = "";
//     const sheets = (await opened_book(user))!.sheets;
//     const sheet: Sheet = (await sheet_to_open(user)).data;
//     let updated_sheets: Sheet[] = (await opened_book(user))!.sheets;
//     let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
//     const emptycase: Case = (await empty_case(user)).data!;
//     var nbCases = amount / sheet.bet!;
//     if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide" };
//     var targetdIndex = emptycase.index == 0 ? emptycase.index : emptycase.index + 1;
//     // for (let i = 0; i < nbCases; i++) sheet.cases[i + targetdIndex].contributionStatus = status;
//     for (let i = 0; i < nbCases; i++) sheet.cases[i + emptycase.index].contributionStatus = status;
//     updated_sheets[sheetIndex] = sheet!;
//     return { error, message, updated_sheets };
// }

// Method: Mobile money
// Update sheet for contribution (Agent)
export async function sheet_contribute_mobile(user: string, amount: number, status: string) {
    const targeted_user = await prisma.user.findUnique({ where: { id: user } });
    let error: boolean = false;
    let message: string = "";
    const sheets = (await opened_book(targeted_user!))!.sheets;
    const sheet: Sheet = (await sheet_to_open(targeted_user!)).data;
    let updated_sheets: Sheet[] = (await opened_book(targeted_user!))!.sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const emptycase: Case = (await empty_case(targeted_user!)).data!;
    var nbCases = amount / sheet.bet!;
    console.log("Mise" + sheet.bet!)
    if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide" };
    var targetdIndex = emptycase.index == 0 ? emptycase.index : emptycase.index + 1;
    // for (let i = 0; i < nbCases; i++) sheet.cases[i + targetdIndex].contributionStatus = status;
    for (let i = 0; i < nbCases; i++) sheet.cases[i + emptycase.index].contributionStatus = status;
    updated_sheets[sheetIndex] = sheet!;
    return { error, message, updated_sheets };
}

export function close_sheets(sheets: Sheet[], sheetid: string, closeat: Date, reason: string) {
    let error: boolean = false;
    let message: string = "";
    let updated_sheets: Sheet[] = sheets;
    let sheet: Sheet | undefined = sheets.find(st => st.id === sheetid);
    let sheetIndex = sheets.findIndex(e => e.id === sheetid);
    if (sheet && sheet.status == "opened") {
        sheet.status = "opened";
        sheet.closeAt = new Date(closeat);
        sheet.closeReason = reason;
    } else { error = true, message = "La feuille ne peut pas être bloquée" }

    updated_sheets[sheetIndex] = sheet!;

    return { error, message, updated_sheets };
}

export function update_case(sheets: Sheet[], sheetid: string, caseid: string, status: string) {
    let error: boolean = false;
    let message: string = "";
    let updated_sheets: Sheet[] = sheets;
    let sheet: Sheet | undefined = sheets.find(st => st.id === sheetid);
    let sheetIndex = sheets.findIndex(e => e.id === sheetid);
    if (sheet && sheet.status == "opened") {
        let _case: Case | undefined = sheet.cases.find(c_s => c_s.id === caseid);
        let _caseIndex = sheet.cases.findIndex(e => e.id === caseid);
        if (_case && _case.contributionStatus == "unpaid") {
            _case.contributionStatus = status;
            sheet.cases[_caseIndex] = _case;
        } else { error = true, message = "Already updated" }
    } else { error = true, message = "Vous ne pouvez pas cotiser pour cette feuille" }

    updated_sheets[sheetIndex] = sheet!;

    return { error, message, updated_sheets };
}

// Timestamp from string || Date
export function todate(date: Date) {
    const djsdate = dayjs(date).format("MM/DD/YYYY");
    const tdate = new Date(djsdate);
    const dtime = tdate.getTime();
    return dtime;
}

// Customer contributions
export async function customerContributions(user: User): Promise<Contribution[]> {
    return prisma.contribution.findMany({ where: { customer: user }, include: { customer: true } });
}

// Agent contributions
export async function userAgentContributions(user: User) {
    return await prisma.contribution.findMany({ where: { agent: user.id }, include: { customer: true } });
}

// all
export async function allContributions(): Promise<Contribution[]> {
    return await prisma.contribution.findMany({ include: { customer: true } });
}

const notificationdata = {
    // Add APNS (Apple) config
    "apns": {
        "payload": {
            "aps": {
                "contentAvailable": true,
            },
        },
        "headers": {
            "apns-push-type": "background",
            "apns-priority": "5", // Must be `5` when `contentAvailable` is set to true.
            "apns-topic": "io.flutter.plugins.firebase.messaging", // bundle identifier
        },
    },
};

export async function sendPushNotification(token: string, title: string, body: string) {
    let result = false;
    try {
        const payload: TokenMessage = { ...notificationdata, notification: { title, body, }, android: { priority: 'high' }, token };
        let message = await admin.messaging().send(payload);
        if (message) { result = true };
    } catch (e) {
        console.log(e);
        console.log("Une erreur s'est produite");
        return false;
    }
    return result;
}

export async function sendNotificationToTopic(topic: string, title: string, body: string) {
    let result = false;
    try {
        const payload: MessagingPayload = { ...notificationdata, notification: { title, body }, data: {} };
        let message = await admin.messaging().sendToTopic(topic, payload);
        if (message) { result = true };
    } catch (e) {
        console.log(e);
        console.log("Une erreur s'est produite");
        return false;
    }
    return result;
}

// Find products by list id ([id...])
export const products_byids = async (content: string[]) => {
    const result = await prisma.product.findMany({
        where: { id: { in: content } }
    });
    if (!result) return { error: true, message: "none", data: {} };
    // console.log(result)
    return { error: false, message: "ok!", data: result };
}


export const all_category_products = async (catid: string) => {
    let itemsResult: Item[] = [];
    let productResult: Product[] = [];
    let products = await prisma.product.findMany();
    let subcategories = await prisma.subCategory.findMany();
    subcategories = subcategories.filter((sbct) => sbct.category == catid);
    if (catid == '') return products;
    for (let subcat of subcategories) {
        let items = await getItemsWithId(subcat.id);
        if (items) itemsResult.push(...items);
    }
    if (itemsResult) {
        for (let ite of itemsResult) {
            let pdts = await getProductWithId(ite.id);
            if (pdts) productResult.push(...pdts);
        }
    }
    return productResult;
}

const getProductWithId = async (itemId: string) => {
    let result: Product[] = [];
    let products = await prisma.product.findMany();
    products.forEach((product) => {
        if (product.item === itemId) {
            result.push(product);
        }
    });
    return result;
}

const getItemsWithId = async (subcatid: string) => {
    let result: Item[] = [];
    let items = await prisma.item.findMany();
    items.forEach((item) => {
        if (item.subcategory == subcatid) {
            result.push(item);
        }
    });
    return result!;
}