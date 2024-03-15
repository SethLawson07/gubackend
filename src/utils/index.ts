import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { prisma } from "../server";
import * as crypto from "crypto";
import axios from "axios";
import { Book, Case, Contribution, Sheet, User } from "@prisma/client";
import { ObjectId } from "bson";
import admin from "firebase-admin";
import serviceAccount from '../token/goodpay-86d48-c5c79b945b8f.json';
import { MessagingPayload, TokenMessage } from "firebase-admin/lib/messaging/messaging-api";
import dayjs from "dayjs";

export const verboseFormat = ':remote-addr :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';

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

export const randomUniqueInteger = () => {
    return Math.floor(Math.random() * Math.floor(Math.random() * Date.now())) + (Date.now() * 3);
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

export type contribution_schema = {
    customer: string,
    amount: number,
    p_method: string,
    createdAt: Date,
}

export type contribution_validation_schema = {
    customer: User,
    targeted_contribution: Contribution,
    user: User,
    result: any,
    schemadata: any,
    validated: any,
    book: Book,
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

// export async function generate_payment_link(amount: number, user: string, order_id: string) {
//     const transaction_id = crypto.randomUUID()
//     const data = {
//         "apikey": "25443723563ef760b99c2b5.76392442",
//         "site_id": "636165",
//         "transaction_id": transaction_id,
//         "amount": amount,
//         "currency": "XOF",
//         "description": "Reglement de commande",
//         "customer_id": user,
//         "notify_url": `https://goodness-1e5ee24644b9.herokuapp.com/hook/payment_event/${order_id}`,
//         "return_url": "https://google.com",
//         "channels": "ALL",
//         "lang": "FR"
//     }
//     const payment_request_response = await axios.post(
//         "https://api-checkout.cinetpay.com/v2/payment",
//         data
//     ).then(res => {
//         if (res.status !== 200) {
//             console.log(`Error while getting payment url`);
//             return { status: false, url: "" };
//         }
//         const response = res.data as { data: { payment_url: string } };
//         return { status: true, url: response.data.payment_url };
//     })
//     return payment_request_response;
// }



// Calculate distance between points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(3);
};


export const userWithDistanceFilter = async (users: any[], aLng: number, aLat: number) => {
    const userWithDistances = users.map((user) => ({
        ...user,
        distance: calculateDistance(
            aLat, aLng, parseFloat(user.location.split("|")[0]), parseFloat(user.location.split("|")[1])
        ),
    }));
    return userWithDistances.sort((a, b) => a.distance - b.distance);
};

export const checkDriverBalance = async (driver: any) => {
    const account = await prisma.account.findFirst({ where: { userId: driver.id } });
    return !!(account && account.balance > 3000);
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
            id: sheetId, createdAt: date, cases: create_cases(sheetId), bet: bet, book: book.id, status: "notopened", index: index,
        } as Sheet;
        return sheet;
    }) as Sheet[];
}

export function create_cases(sheet: string): Case[] {
    return Array.from({ length: 31 }, (_, index) => {
        const _case = {
            id: geneObjectId(), contributionStatus: "unpaid", sheet: sheet, index: index,
        } as Case;
        return _case;
    }) as Case[];
}

// Carnet ouvert
export async function opened_book(userId: string) {
    const book = await prisma.book.findFirst({ where: { userId: userId, status: "opened" } });
    if (!book) return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
    return { error: false, message: "ok", book: true, data: book };
}

// Feuille ouverte
export async function opened_sheet(user: User) {
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null };
    var sheetOpened = book.data.sheets.find((st) => st.status === "opened");
    if (!sheetOpened) return { error: true, message: "Aucune feuille ouverte", book: true };
    return { error: false, message: "", data: sheetOpened as Sheet, book: true };
}

// Case remplie
export async function empty_case(user: User) {
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null };
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
    var book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null };
    if (!book) return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
    var sheetToOpen: Sheet;
    const findLastClosedSheet = book.data.sheets.findLast((st) => st.status === "closed");
    if (!findLastClosedSheet) {
        sheetToOpen = book.data.sheets[0];
    } else {
        if (findLastClosedSheet.index == 11) {
            await prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
            return { error: false, message: "Fin de feuille", book: null }
        } else { sheetToOpen = book.data.sheets[findLastClosedSheet.index + 1]; }
    }
    return { error: false, message: "ok", data: sheetToOpen, book: true };
}

export async function sheet_to_close(user: User) {
    var book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
    const sheetToClose = book.data.sheets.find((st) => st.status === "opened");
    if (!sheetToClose) return { error: true, message: "Aucune feuille ouverte", book: null, data: null };
    return { error: false, message: "ok", book: null, data: sheetToClose };
}

// Open sheet
export async function update_sheets(user: User, openedat: Date, bet: number) {
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const sheetToOpen = await sheet_to_open(user);
    if (sheetToOpen.error || sheetToOpen.data == null) return { error: true, message: sheetToOpen.message, book: true, update_sheets: null };
    const sheet: Sheet = sheetToOpen.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetToOpenIndex = sheets.findIndex(e => e.id === sheet.id);
    if (sheet) {
        if (sheetToOpenIndex == 0) {
            if (sheet.status == "opened") return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
            sheet.status = "opened"; sheet.openedAt = new Date(openedat); sheet.bet = bet;
        } else {
            switch (sheets[sheetToOpenIndex - 1].status) {
                case "notopened": return { error: true, message: "Feuille actuelle non ouverte | Erreur fatale", book: true, update_sheets: null, data: {} };
                case "opened": return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
                case "closed": if (sheetToOpenIndex > 11) {
                    return { error: true, message: "Vous êtes sur la dernière feuille", book: true, update_sheets: null, data: {} };
                } else { sheet.status = "opened"; sheet.openedAt = new Date(openedat); sheet.bet = bet; }
                default: break;
            }
        }
    } else { return { error: true, message: "Ouverture de feuille impossible", book: true, update_sheets: null, data: {} }; }
    updated_sheets[sheetToOpenIndex] = sheet;
    return { error, message, updated_sheets, book: true, sheet };
}

// Update sheet for contribution (Method: agent)
export async function sheet_contribute(userid: string, amount: number, pmethod: string) {
    const user = (await prisma.user.findUnique({ where: { id: userid } }))!;
    const status = pmethod === "agent" ? "awaiting" : "paid";
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null, sheet: null };
    const sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const emptycase: Case = (await empty_case(user)).data!;
    var nbCases = amount / sheet.bet!;
    if (!utilisIsInt(nbCases)) return { error: true, message: "Montant saisie invalide", };
    const awCases = sheet.cases.filter((cse) => cse.contributionStatus == "awaiting");
    if (emptycase.index == 31 && awCases.length > 0) return { error: true, message: "Feuille remplie, Cotisations en cours de validation." }
    if (sheet.index == 11 && emptycase.index == 31) return { error: true, message: "Le carnet est remplie", isBookFull: true };
    if (emptycase.index == 31) return { error: true, message: "La feuille est remplie", isSheetFull: true };
    if (emptycase.index + nbCases > 31) return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)` };
    let cases = [];
    for (let i = 0; i < nbCases; i++) {
        sheet.cases[i + emptycase.index].contributionStatus = status; cases.push((emptycase.index + i));
    };
    updated_sheets[sheetIndex] = sheet;
    return { error, message, updated_sheets, cases, sheet, sheetId: sheet.id, book };
}


// Check for empty cases
export async function sheet_validation(userid: string, amount: number) {
    const user = (await prisma.user.findUnique({ where: { id: userid } }))!;
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
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
            break;
        };
        case "unpaid": {
            const lg = reference - size + 1;
            if (lg > 0) for (let i = 0; i < lg; i++) update_sheet.cases[lg + i].contributionStatus = "unpaid";
            else { update_sheet.cases[0].contributionStatus = "unpaid"; }
            break;
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
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
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
    return { error, message, updated_sheets, cases, sheet, book };
}


// Update sheet for contribution (Method: agent)
export async function sheet_reject(user: User, cases: number[]) {
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(user.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(user);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
    let sheet: Sheet = openedSheet.data;
    let updated_sheets: Sheet[] = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    const reference = await sheet_case_reference("unpaid", sheet);
    sheet = await sheet_cases_validate("unpaid", reference, sheet, cases.length);
    // for (let i = 0; i < cases.length; i++) sheet.cases[cases[i] - 1].contributionStatus = "rejected";
    updated_sheets[sheetIndex] = sheet;
    return { error: false, message: "Rejeté", updated_sheets, cases, sheet, book };
}

// Method: Mobile money
// Update sheet for contribution (Agent)
export async function sheet_contribute_mobile(user: string, amount: number, status: string) {
    const targeted_user = await prisma.user.findUnique({ where: { id: user } });
    let error: boolean = false;
    let message: string = "";
    const book = await opened_book(targeted_user!.id);
    if (book.error || !book.book || !book.data) return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
    const sheets = book.data.sheets;
    const openedSheet = await sheet_to_open(targeted_user!);
    if (openedSheet.error || openedSheet.data == null) return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
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
export async function allContributions(data: any): Promise<Contribution[]> {
    return await prisma.contribution.findMany({
        where:
            data.userId == "all" ? { status: data.status, createdAt: { gte: data.startDate, lte: data.endDate, } } :
                { userId: data.userId, status: data.status, createdAt: { gte: data.startDate, lte: data.endDate, } }, include: { customer: true }
    });
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

export const gateways: any = {
    "moovmoney": 47,
    "tmoney": 2,
};

export const operatorChecker = (phone: string) => {
    let operator = "moovmoney";
    console.log(phone)
    if (phone.startsWith("+228") || phone.startsWith("228")) {
        const first = phone.replace('228', "").trim().slice(0, 2);
        if (firsttwonumberstogocomArray.includes(first)) { operator = "tmoney"; }
    } else if (firsttwonumberstogocomArray.includes(phone.trim().slice(0, 2))) {
        operator = "tmoney";
    }
    return operator;
}

//Check TG Phone Opérator with first Two number
export const semoaCashPayGateway = (gateway: string) => {
    return gateways[gateway];
}