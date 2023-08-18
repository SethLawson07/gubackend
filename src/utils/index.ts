import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { prisma } from "../server";
import * as crypto from "crypto";
import axios from "axios";
import { Book, Case, Sheet, User } from "@prisma/client";
import { ObjectId } from "bson";
import { json } from "express";
import admin from "firebase-admin";
import serviceAccount from '../token/goodpay-86d48-c5c79b945b8f.json';

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
        "notify_url": `https://api-goodness.herokuapp.com/hook/payment_event/${order_id}`,
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

export function geneObjectId() { return (new ObjectId()).toString(); }

// export const json_result = (status: Number, error: boolean, data: Object): Object => {
//     return {}
// book: 64da1da3b80904cdbb9dc14a
// sh..: 64da1da43e80b0413c57f52c
// }

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
            index: index + 1,
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
            index: index + 1,
        } as Case;
        return _case;
    }) as Case[];
}

// export function contribution_status(p_method: string, u_awaiting: string) {
//     let result = "";
//     switch (p_method) {
//         case "mobile_money":
//             result = "paid";
//             break;
//         case "agent" && u_awaiting == "":

//             break;
//         default:
//             break;
//     }
// }

export function update_sheets(sheets: Sheet[], sheetid: string, openedat: Date, bet: number) {
    let error: boolean = false;
    let message: string = "";
    let updated_sheets: Sheet[] = sheets;
    let sheet: Sheet | undefined = sheets.find(st => st.id === sheetid);
    let sheetIndex = sheets.findIndex(e => e.id === sheetid);
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


export async function sendPushNotification(token: string) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseServiceAccountParams),
        })
        const payload = {
            "token": token,
            "data": {},
            "notification": {
                "title": "FCM Message",
                "body": "This is an FCM notification message!",
            },
            // "click_action": "FLUTTER_NOTIFICATION_CLICK",
        };
        let result = await admin.messaging().send(payload);
        console.log(result);
    } catch (e) {
        console.log(e);
        console.log("Une erreur s'est produite");
    }
}