import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { prisma } from "../server";
import * as crypto from "crypto";
import axios from "axios";
import { Book, Brand, Case, Contribution, Item, Product, Sheet, User } from "@prisma/client";
import { ObjectId } from "bson";
import admin from "firebase-admin";
import serviceAccount from '../token/goodpay-86d48-c5c79b945b8f.json';
import { MessagingPayload, TokenMessage } from "firebase-admin/lib/messaging/messaging-api";
import dayjs from "dayjs";

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


export const firsttwonumberstogocomArray = ["90", "91", "92", "93", "70"]
export const firsttwonumbersmoovafricaArray = ["96", "97", "98", "99"]

type user_data = {
    is_admin: boolean;
    role: string;
    user_name: string;
    email?: string | null;
    phone: string;
    profile_picture: string;
}

export function sign_token(user: user_data) {
    return jwt.sign({ user }, JWT_TOKEN);
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
        "notify_url": `https://goodness-1e5ee24644b9.herokuapp.com/hook/payment_event/${order_id}`,
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

// Carnet ouvert
export async function opened_book(user: User) {
    const book = await prisma.book.findFirst({ where: { userId: user.id, status: "opened" } });
    if (!book) return { error: true, message: "Pas de carnet ouvert", book: false, data: null };
    return { error: false, message: "ok", book: true, data: book };
}

// Feuille ouverte
export async function opened_sheet(user: User) {
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false };
    var sheetOpened = book.data.sheets.find((st) => st.status === "opened");
    if (!sheetOpened) return { error: true, message: "Aucune feuille ouverte", book: true };
    return { error: false, message: "", data: sheetOpened as Sheet, book: true };
}

// Case remplie
export async function empty_case(user: User) {
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false };
    var lastContributedCase: Case;
    var sheetOpened = book.data.sheets.find((st) => st.status === "opened");
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
    var book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false };
    if (!book) return { error: true, message: "Pas de carnet ouvert", book: false, data: null };
    var sheetToOpen: Sheet;
    const findLastClosedSheet = book.data.sheets.findLast((st) => st.status === "closed");
    if (!findLastClosedSheet) {
        sheetToOpen = book.data.sheets[0];
    } else sheetToOpen = book.data.sheets[findLastClosedSheet.index + 1];
    if (findLastClosedSheet?.index == 11) {
        await prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
        return { error: false, message: "Fin de feuille", book: false }
    }
    return { error: false, message: "ok", data: sheetToOpen, book: true };
}

export async function sheet_to_close(user: User) {
    var book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, data: null };
    const sheetToClose = book.data.sheets.find((st) => st.status === "opened");
    if (!sheetToClose) return { error: true, message: "Aucune feuille ouverte", book: false, data: null };
    return { error: false, message: "ok", book: false, data: sheetToClose };
}

// Open sheet
export async function update_sheets(user: User, openedat: Date, bet: number) {
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const sheetToOpen = await sheet_to_open(user);
    if (sheetToOpen.error || sheetToOpen.data == null) return { error: true, message: sheetToOpen.message, book: true, update_sheets: null };
    const sheet: Sheet = sheetToOpen.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetToOpenIndex = sheets.findIndex(e => e.id === sheet.id);
    if (sheet) {
        if (sheetToOpenIndex == 0) {
            if (sheet.status == "opened") return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
            sheet.status = "opened"; sheet.openedAt = new Date(openedat!); sheet.bet = bet;
        } else {
            switch (sheets[sheetToOpenIndex - 1].status) {
                case "notopened": return { error: true, message: "Feuille actuelle non ouverte | Erreur fatale", book: true, update_sheets: null, data: {} };
                case "opened": return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
                case "closed": if (sheetToOpenIndex == 11) {
                    return { error: true, message: "Vous êtes sur la dernière feuille", book: true, update_sheets: null, data: {} };
                } else {
                    sheet.status = "opened"; sheet.openedAt = new Date(openedat!); sheet.bet = bet;
                }
                default: break;
            }
        }
    } else {
        return { error: true, message: "Ouverture de feuille impossible", book: true, update_sheets: null, data: {} }
    }
    updated_sheets[sheetToOpenIndex] = sheet!;
    return { error, message, updated_sheets, book: true };
}

// Update sheet for contribution (Method: agent)
export async function sheet_contribute(userid: string, amount: number, pmethod: string) {
    const user = (await prisma.user.findUnique({ where: { id: userid } }))!;
    const status = pmethod === "agent" ? "awaiting" : "paid";
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null, sheet: null };
    const sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const emptycase: Case = (await empty_case(user)).data!;
    var nbCases = amount / sheet.bet!;
    if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide", };
    if (sheet.index == 11 && emptycase.index == 31) return { error: true, message: "Le carnet est remplie", isBookFull: true };
    if (emptycase.index == 31) return { error: true, message: "La feuille est remplie", isSheetFull: true };
    if (emptycase.index + nbCases > 31) return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)` };
    let cases = [];
    for (let i = 0; i < nbCases; i++) {
        sheet.cases[i + emptycase.index].contributionStatus = status;
        cases.push((emptycase.index + i));
    };
    updated_sheets[sheetIndex] = sheet;
    return { error, message, updated_sheets, cases, sheet, sheetId: sheet.id };
}


// Check for empty cases
export async function sheet_validation(userid: string, amount: number) {
    const user = (await prisma.user.findUnique({ where: { id: userid } }))!;
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
    const sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    const emptycase: Case = (await empty_case(user)).data!;
    var nbCases = amount / sheet.bet!;
    if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide", data: {} };
    if (sheet.index == 11 && emptycase.index == 31) return { error: true, message: "Le carnet est remplie", isBookFull: true, data: {} };
    if (emptycase.index == 31) return { error: true, message: "La feuille est remplie", isSheetFull: true, data: {} };
    if (emptycase.index + nbCases > 31) return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)`, data: {} };
    return { error: false, message: "ok", updated_sheets, cases: [], sheet };
}

export async function sheet_case_reference(status: string, sheet: Sheet): Promise<number> {
    let referenceBox = undefined;
    switch (status) {
        case "paid": referenceBox = sheet.cases.find((cs) => cs.contributionStatus == "awaiting")?.index; break;
        case "unpaid": referenceBox = sheet.cases.findLast((cs) => cs.contributionStatus == "awaiting")?.index; break;
        case "awaiting": referenceBox = sheet.cases.find((cs) => cs.contributionStatus == "unpaid")?.index; break;
        default: referenceBox = 0;
    }
    return referenceBox!;
}

export async function sheet_cases_validate(status: string, reference: number, sheet: Sheet, size: number): Promise<Sheet> {
    let update_sheet = sheet;
    switch (status) {
        case "paid": {
            for (let i = 0; i < size; i++) update_sheet.cases[reference + i].contributionStatus = "paid";
        };
        case "unpaid": {
            for (let i = 0; i < reference - size + 1; i++) update_sheet.cases[reference + i].contributionStatus = "unpaid";
        };
        // case "awaiting": referenceBox = sheet.cases.findIndex((cs) => cs.contributionStatus == "unpaid"); break;
        default: update_sheet = sheet;
    }
    return update_sheet;
}

// Update sheet for contribution (Method: agent)
export async function sheet_validate(user: User, cases: number[], status: string) {
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
    let sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    if (status == "awaiting") { ; }
    else {
        const reference = await sheet_case_reference(status, sheet);
        sheet = await sheet_cases_validate(status, reference, sheet, cases.length);
        // for (let i = 0; i < cases.length; i++) sheet.cases[cases[i] - 1].contributionStatus = status;
    }
    updated_sheets[sheetIndex] = sheet;
    return { error, message, updated_sheets, cases, sheet };
}


// Update sheet for contribution (Method: agent)
export async function sheet_reject(user: User, cases: number[]) {
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
    const sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    for (let i = 0; i < cases.length; i++) sheet.cases[cases[i] - 1].contributionStatus = "rejected";
    updated_sheets[sheetIndex] = sheet!;
    return { error, message, updated_sheets, cases, sheet };
}

// Method: Mobile money
// Update sheet for contribution (Agent)
export async function sheet_contribute_mobile(user: string, amount: number, status: string) {
    const targeted_user = await prisma.user.findUnique({ where: { id: user } });
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(targeted_user!);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(targeted_user!);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
    const sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const emptycase: Case = (await empty_case(targeted_user!)).data!;
    var nbCases = amount / sheet.bet!;
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
    return dayjs(date).format("YYYY-MM-DD");
}

export function todateTime(date: Date) {
    return dayjs(date).format();
}

// Customer contributions
export async function customerContributions(user: User): Promise<Contribution[]> {
    return prisma.contribution.findMany({ where: { userId: user.id }, include: { customer: true } });
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
    "apns": {
        "payload": { "aps": { "contentAvailable": true, }, },
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
    const result = await prisma.product.findMany({ where: { id: { in: content } } });
    if (!result) return { error: true, message: "none", data: {} };
    return { error: false, message: "ok!", data: result };
}


export const all_category_products = async (catid: string): Promise<Product[]> => {
    let itemsResult: Item[] = [];
    let productResult: Product[] = [];
    let products = await prisma.product.findMany({ include: { brand_data: true } });
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

export const all_category_brands = async (catid: string) => {
    let products = await all_category_products(catid);
    let brands: string[] = [];
    let brandData: Brand[] = [];
    if (products) {
        products.forEach(product => {
            brands.push(product.brand);
        });
    }
    if (brands) {
        brandData = await prisma.brand.findMany({ where: { id: { in: brands } } })
    }
    return brandData;
}

const getProductWithId = async (itemId: string) => {
    let result: Product[] = [];
    let products = await prisma.product.findMany({ include: { brand_data: true } });
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

export const operatorChecker = (phone: string) => {
    let operator = "moovmoney";
    // if (phone.startsWith("228")) {
    //     const first = phone.replace('228', "").trim().slice(0, 2);
    //     console.log(first);

    // } else { }
    if (firsttwonumberstogocomArray.includes(phone.trim().slice(0, 2))) { operator = "tmoney"; }
    if (firsttwonumbersmoovafricaArray.includes(phone.trim().slice(0, 2))) { operator = "moovmoney"; }
    return operator;
}

export const utilsTotalReport = async (type: string, agent: string[], method: string) => {
    // {
    //     const totalDeposit = (await prisma.deposit.aggregate({ _sum: { amount: true } }))._sum ?? 0;
    //     const totalContribution = (await prisma.deposit.aggregate({ _sum: { amount: true } }))._sum ?? 0;
    //     const total = totalContribution.amount! + totalDeposit.amount!;
    // }
    switch (type) {
        case "contribution":
            const contribution = await prisma.contribution.findMany({
                where: { agent: { in: agent }, pmethod: method }
            });
            break;
        case "deposit":
            const deposit = await prisma.deposit.findMany({
                where: { payment: method }
            });
        default:
            break;
    }
}

export const utilsNonSpecifiedReport = async (type: string, agent: string[], method: string) => {
    switch (type) {
        case "contribution":
            const contribution = await prisma.contribution.findMany({
                where: { agent: { in: agent }, pmethod: method }
            });
            break;
        case "deposit":
            const deposit = await prisma.deposit.findMany({
                where: { payment: method }
            });
        default:
            break;
    }
}